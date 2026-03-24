import type { ProductVariation } from "./types";
import { brands, categories } from "./data";

const ALLOWED_CATEGORY_IDS = new Set(categories.map((c) => c.id));
const ALLOWED_BRAND_IDS = new Set(brands.map((b) => b.id));

export const PRODUCT_NAME_MAX = 280;
export const PRODUCT_DESC_MAX = 100_000;
export const SLUG_MAX_LEN = 128;
export const IMAGE_URL_MAX = 2048;
export const MAX_GALLERY_IMAGES = 24;
export const MAX_VARIATIONS = 25;
export const MAX_OPTIONS_PER_VARIATION = 60;
export const VARIATION_NAME_MAX = 100;
export const OPTION_LABEL_MAX = 200;
export const SKU_MAX = 80;
export const ATTR_MAX = 500; // scale / material / height

const PRICE_MAX = 99_999_999;
const PRICE_MIN = 0;

/** 规范化 URL slug：小写、仅 a-z0-9-，空则回退为 `product` */
export function normalizeProductSlug(rawSlug: string, fallbackName: string): string {
  const fromInput = rawSlug.trim();
  const base = fromInput || fallbackName.trim();
  const normalized = base
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, SLUG_MAX_LEN);
  return normalized || "product";
}

function isAllowedImageUrl(s: string): boolean {
  const t = s.trim();
  if (!t || t.length > IMAGE_URL_MAX) return false;
  if (/^https?:\/\//i.test(t)) return true;
  if (t.startsWith("/") && t.length > 1 && !/\s/.test(t)) return true;
  return false;
}

function validatePrice(label: string, n: number): string | null {
  if (!Number.isFinite(n)) return `Invalid ${label}.`;
  if (n < PRICE_MIN || n > PRICE_MAX) return `${label} must be between ${PRICE_MIN} and ${PRICE_MAX}.`;
  return null;
}

function validateVariations(vs: ProductVariation[] | undefined): string | null {
  if (!vs?.length) return null;
  if (vs.length > MAX_VARIATIONS) return `Too many variation groups (max ${MAX_VARIATIONS}).`;
  for (const v of vs) {
    const n = v.name.trim();
    if (!n || n.length > VARIATION_NAME_MAX) {
      return `Each variation must have a name (max ${VARIATION_NAME_MAX} characters).`;
    }
    if (!v.options?.length) return `Variation "${n}" needs at least one option.`;
    if (v.options.length > MAX_OPTIONS_PER_VARIATION) {
      return `Too many options in "${n}" (max ${MAX_OPTIONS_PER_VARIATION}).`;
    }
    for (const o of v.options) {
      const lab = String(o.label ?? "").trim();
      if (!lab || lab.length > OPTION_LABEL_MAX) {
        return `Each option needs a label (max ${OPTION_LABEL_MAX} characters).`;
      }
      const pe = validatePrice("Option price", o.price);
      if (pe) return pe;
      if (o.sku != null && String(o.sku).length > SKU_MAX) return `SKU too long (max ${SKU_MAX}).`;
      if (o.image != null && o.image !== "" && !isAllowedImageUrl(o.image)) {
        return "Variation option image must be a valid http(s) URL or path.";
      }
    }
  }
  return null;
}

/** 校验 Admin 商品写入；通过返回 `null`，否则返回可读错误信息 */
export function validateAdminProductPayload(params: {
  nameEn: string;
  descEn: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  primaryImage: string;
  imageUrls: string[];
  category: string;
  brandId: string;
  characterId: string | null;
  variations?: ProductVariation[];
  scale: string | null;
  material: string | null;
  height: string | null;
}): string | null {
  const name = params.nameEn.trim();
  const desc = params.descEn.trim();
  if (!name) return "Name is required.";
  if (name.length > PRODUCT_NAME_MAX) return `Name is too long (max ${PRODUCT_NAME_MAX} characters).`;
  if (!desc) return "Description is required.";
  if (desc.length > PRODUCT_DESC_MAX) {
    return `Description is too long (max ${PRODUCT_DESC_MAX} characters).`;
  }

  const slug = params.slug.trim();
  if (!slug || slug.length > SLUG_MAX_LEN) return "Invalid product slug.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return "Slug may only contain lowercase letters, numbers, and hyphens.";

  const pe = validatePrice("Price", params.price);
  if (pe) return pe;

  if (params.originalPrice != null) {
    if (!Number.isFinite(params.originalPrice)) return "Invalid original price.";
    const oe = validatePrice("Original price", params.originalPrice);
    if (oe) return oe;
  }

  if (!params.imageUrls.length) return "At least one image URL is required.";
  if (params.imageUrls.length > MAX_GALLERY_IMAGES) {
    return `Too many images (max ${MAX_GALLERY_IMAGES}).`;
  }
  for (const u of params.imageUrls) {
    if (!isAllowedImageUrl(u)) return "Each image must be a valid http(s) URL or a path starting with /.";
  }
  if (!isAllowedImageUrl(params.primaryImage)) return "Primary image URL is invalid.";

  if (!ALLOWED_CATEGORY_IDS.has(params.category as (typeof categories)[number]["id"])) {
    return "Invalid category.";
  }
  if (!ALLOWED_BRAND_IDS.has(params.brandId as (typeof brands)[number]["id"])) {
    return "Invalid brand.";
  }

  if (params.characterId != null && params.characterId !== "") {
    const c = params.characterId.trim();
    if (c.length > 80) return "Character id is too long.";
    if (!/^[a-zA-Z0-9_-]+$/.test(c)) return "Character id may only use letters, numbers, underscore, and hyphen.";
  }

  for (const [label, val] of [
    ["Scale", params.scale],
    ["Material", params.material],
    ["Height", params.height],
  ] as const) {
    if (val && val.length > ATTR_MAX) return `${label} is too long (max ${ATTR_MAX} characters).`;
  }

  return validateVariations(params.variations);
}
