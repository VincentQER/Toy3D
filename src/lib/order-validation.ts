import "server-only";
import { prisma } from "@/lib/db";
import type { ProductVariation, SelectedVariant } from "@/lib/types";

export type ValidatedOrderItem = {
  productId: string;
  quantity: number;
  variantSnapshot: string | null;
  priceAtPurchase: number;
  /** Stripe / 邮件展示用 */
  displayName: string;
};

export interface CartLineInput {
  productId?: string;
  product?: { id: string };
  quantity?: number;
  selectedVariant?: SelectedVariant;
}

const MAX_CART_LINES = 50;
const MAX_QTY_PER_LINE = 99;
const MAX_ORDER_TOTAL = 10_000_000;
const MAX_PRODUCT_ID_LEN = 64;
const MAX_SNAPSHOT_CHARS = 2048;

function parseProductVariations(json: string | null): ProductVariation[] | null {
  if (!json?.trim()) return null;
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed as ProductVariation[];
  } catch {
    return null;
  }
}

/**
 * 用数据库中的变体定义解析价格与快照，**不信任客户端传来的 variant.price**。
 */
function resolvePriceAndSnapshot(
  product: { name: string; price: number; variations: string | null },
  selected: SelectedVariant | undefined,
): { ok: true; price: number; snapshot: SelectedVariant | null } | { ok: false; error: string } {
  const groups = parseProductVariations(product.variations);
  const hasVariations = !!groups?.length;

  if (hasVariations) {
    if (!selected?.variationName?.trim() || !selected.optionLabel?.trim()) {
      return { ok: false, error: `Please select an option for: ${product.name}` };
    }
    const vName = selected.variationName.trim().slice(0, 100);
    const oLabel = selected.optionLabel.trim().slice(0, 200);
    const vg = groups!.find((v) => v.name === vName);
    if (!vg) {
      return { ok: false, error: `Invalid variant group for: ${product.name}` };
    }
    const opt = vg.options.find((o) => o.label === oLabel);
    if (!opt) {
      return { ok: false, error: `Invalid option for: ${product.name}` };
    }
    const price = Number(opt.price);
    if (!Number.isFinite(price) || price < 0 || price > MAX_ORDER_TOTAL) {
      return { ok: false, error: `Invalid price for variant: ${product.name}` };
    }
    const snapshot: SelectedVariant = {
      variationName: vg.name,
      optionLabel: opt.label,
      price,
      ...(opt.sku != null && opt.sku !== "" ? { sku: String(opt.sku).slice(0, 80) } : {}),
    };
    return { ok: true, price, snapshot };
  }

  if (selected) {
    return { ok: false, error: `This product does not use options: ${product.name}` };
  }

  const base = Number(product.price);
  if (!Number.isFinite(base) || base < 0 || base > MAX_ORDER_TOTAL) {
    return { ok: false, error: `Invalid product price: ${product.name}` };
  }
  return { ok: true, price: base, snapshot: null };
}

/**
 * 校验购物车行并计算金额（与 POST /api/orders、Stripe Checkout 逻辑一致）
 */
export async function validateCartLines(
  items: CartLineInput[],
): Promise<{ ok: true; lines: ValidatedOrderItem[]; total: number } | { ok: false; error: string }> {
  if (!items?.length) {
    return { ok: false, error: "Cart is empty" };
  }
  if (items.length > MAX_CART_LINES) {
    return { ok: false, error: `Cart has too many line items (max ${MAX_CART_LINES}).` };
  }

  const lines: ValidatedOrderItem[] = [];
  let total = 0;

  for (const item of items) {
    const productIdRaw = item.productId ?? item.product?.id;
    const productId =
      typeof productIdRaw === "string" ? productIdRaw.trim() : String(productIdRaw ?? "").trim();
    if (!productId) {
      return { ok: false, error: "Missing productId on line item" };
    }
    if (productId.length > MAX_PRODUCT_ID_LEN) {
      return { ok: false, error: "Invalid product id on line item" };
    }

    const qtyNum = Number(item.quantity);
    if (!Number.isFinite(qtyNum) || !Number.isInteger(qtyNum) || qtyNum < 1 || qtyNum > MAX_QTY_PER_LINE) {
      return {
        ok: false,
        error: `Invalid quantity (must be an integer from 1 to ${MAX_QTY_PER_LINE}).`,
      };
    }
    const quantity = qtyNum;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return { ok: false, error: `Product not found: ${productId}` };
    }

    const resolved = resolvePriceAndSnapshot(product, item.selectedVariant);
    if (!resolved.ok) {
      return resolved;
    }

    const { price, snapshot } = resolved;
    const variantSnapshot = snapshot ? JSON.stringify(snapshot) : null;
    if (variantSnapshot && variantSnapshot.length > MAX_SNAPSHOT_CHARS) {
      return { ok: false, error: "Variant data is too large." };
    }

    total += price * quantity;
    if (!Number.isFinite(total) || total > MAX_ORDER_TOTAL) {
      return { ok: false, error: "Order total exceeds allowed maximum." };
    }

    const variantLabel = snapshot ? ` (${snapshot.variationName}: ${snapshot.optionLabel})` : "";
    lines.push({
      productId,
      quantity,
      variantSnapshot,
      priceAtPurchase: price,
      displayName: `${product.name}${variantLabel}`,
    });
  }

  return { ok: true, lines, total };
}
