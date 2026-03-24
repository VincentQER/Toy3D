import type { Product, SelectedVariant } from "./types";
import type { Locale } from "./locale";

const DEFAULT_LOCALE: Locale = "en";

/** 当前界面语言下的商品名 */
export function getProductName(product: Product, locale: Locale = DEFAULT_LOCALE): string {
  if (locale === "zh" && product.name_i18n?.zh) return product.name_i18n.zh;
  if (locale === "es" && product.name_i18n?.es) return product.name_i18n.es;
  return product.name_i18n?.en ?? product.name;
}

export function getProductDescription(product: Product, locale: Locale = DEFAULT_LOCALE): string {
  if (locale === "zh" && product.description_i18n?.zh) return product.description_i18n.zh;
  if (locale === "es" && product.description_i18n?.es) return product.description_i18n.es;
  return product.description_i18n?.en ?? product.description;
}

/** 商品展示价：有 variant 用 variant 价，否则用 product.price。列表页有 variations 可显示 "From $X" */
export function getProductPrice(product: Product, selectedVariant?: SelectedVariant | null): number {
  if (selectedVariant) return selectedVariant.price;
  return product.price;
}

/** 主图：多图时取 images[0]，否则 image */
export function getProductMainImage(product: Product): string {
  if (product.images?.length) return product.images[0];
  return product.image;
}

/** 图库：多图用 images，否则 [image] */
export function getProductGallery(product: Product): string[] {
  if (product.images?.length) return product.images;
  return [product.image];
}
