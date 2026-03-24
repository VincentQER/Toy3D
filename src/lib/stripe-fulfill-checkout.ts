import "server-only";
import type Stripe from "stripe";
import type { SelectedVariant } from "@/lib/types";
import { prisma } from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/order-email";
import { validateCartLines, type CartLineInput } from "@/lib/order-validation";
import { validateShippingFields } from "@/lib/order-shipping-input";

export type MetadataLine = {
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  variantSnapshot: string | null;
};

function parseItemsFromMetadata(itemsJson: string): MetadataLine[] {
  let raw: unknown;
  try {
    raw = JSON.parse(itemsJson) as unknown;
  } catch {
    throw new Error("Invalid itemsJson in metadata");
  }
  if (!Array.isArray(raw)) {
    throw new Error("itemsJson must be an array");
  }
  if (raw.length === 0) {
    throw new Error("itemsJson is empty");
  }
  if (raw.length > 50) {
    throw new Error("Too many line items in metadata");
  }

  const out: MetadataLine[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") {
      throw new Error("Invalid line item shape");
    }
    const o = row as Record<string, unknown>;
    const productId = String(o.productId ?? "").trim();
    const quantity = Number(o.quantity);
    const priceAtPurchase = Number(o.priceAtPurchase);
    const vs = o.variantSnapshot;
    const variantSnapshot =
      vs == null || vs === "" ? null : typeof vs === "string" ? vs : JSON.stringify(vs);

    if (!productId || productId.length > 64) {
      throw new Error("Invalid productId in metadata line");
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new Error("Invalid quantity in metadata line");
    }
    if (!Number.isFinite(priceAtPurchase)) {
      throw new Error("Invalid priceAtPurchase in metadata line");
    }
    if (variantSnapshot && variantSnapshot.length > 4096) {
      throw new Error("Variant snapshot too large in metadata");
    }
    out.push({ productId, quantity, priceAtPurchase, variantSnapshot });
  }
  return out;
}

function metadataLinesToCartInput(lines: MetadataLine[]): CartLineInput[] {
  return lines.map((line) => {
    let selected: SelectedVariant | undefined;
    if (line.variantSnapshot) {
      try {
        selected = JSON.parse(line.variantSnapshot) as SelectedVariant;
      } catch {
        throw new Error("Invalid variant JSON in metadata line");
      }
    }
    return {
      productId: line.productId,
      quantity: line.quantity,
      selectedVariant: selected,
    };
  });
}

/**
 * 支付成功后建单：复用 `validateCartLines`（库内变体价），并比对 Stripe `amount_total` / `currency`。
 */
export async function fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
  if (session.payment_status !== "paid") {
    return;
  }
  if (session.mode !== "payment") {
    throw new Error(`Unexpected checkout mode: ${session.mode}`);
  }

  const existing = await prisma.order.findFirst({
    where: { stripeCheckoutSessionId: session.id },
  });
  if (existing) {
    return;
  }

  const userId = session.metadata?.userId;
  const shippingName = session.metadata?.shippingName;
  const shippingPhone = session.metadata?.shippingPhone;
  const shippingAddress = session.metadata?.shippingAddress;
  const itemsJson = session.metadata?.itemsJson;

  if (!userId || !shippingName || !shippingPhone || !shippingAddress || !itemsJson) {
    throw new Error("Missing metadata on checkout session");
  }

  if (session.client_reference_id && session.client_reference_id !== userId) {
    throw new Error("client_reference_id does not match userId in metadata");
  }

  const shipErr = validateShippingFields(shippingName, shippingPhone, shippingAddress);
  if (shipErr) {
    throw new Error(`Shipping metadata invalid: ${shipErr}`);
  }

  const metaLines = parseItemsFromMetadata(itemsJson);
  const validated = await validateCartLines(metadataLinesToCartInput(metaLines));
  if (!validated.ok) {
    throw new Error(`Cart revalidation failed: ${validated.error}`);
  }

  const currency = (session.currency ?? "").toLowerCase();
  if (currency !== "usd") {
    throw new Error(`Unexpected currency: ${session.currency}`);
  }

  // 与 Checkout 创建时的 line_items 一致；若启用 Tax / 优惠券，需改对齐策略。
  const paidCents = session.amount_total ?? 0;
  const expectedCents = Math.round(validated.total * 100);
  if (paidCents !== expectedCents) {
    throw new Error(
      `Amount mismatch: Stripe charged ${paidCents}c but cart total is ${expectedCents}c`,
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const order = await prisma.order.create({
    data: {
      userId,
      status: "paid",
      total: validated.total,
      shippingName: String(shippingName).trim(),
      shippingPhone: String(shippingPhone).trim(),
      shippingAddress: String(shippingAddress).trim(),
      stripeCheckoutSessionId: session.id,
      items: {
        create: validated.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          variantSnapshot: line.variantSnapshot,
          priceAtPurchase: line.priceAtPurchase,
        })),
      },
    },
    include: { items: true },
  });

  const productIds = Array.from(new Set(order.items.map((i) => i.productId)));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });
  const productNames = new Map(products.map((p) => [p.id, p.name]));

  await sendOrderConfirmationEmail(
    user.email,
    {
      id: order.id,
      total: order.total,
      shippingName: order.shippingName,
      shippingPhone: order.shippingPhone,
      shippingAddress: order.shippingAddress,
      items: order.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        priceAtPurchase: i.priceAtPurchase,
      })),
    },
    productNames,
  );
}
