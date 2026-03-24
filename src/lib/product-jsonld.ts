import "server-only";

import type { Product } from "@/lib/types";
import { brands, characters } from "@/lib/data";
import { getSiteUrl } from "@/lib/site-url";

function absImageUrl(base: string, url: string): string {
  const u = url.trim();
  if (!u) return base;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("//")) return `https:${u}`;
  return `${base}${u.startsWith("/") ? u : `/${u}`}`;
}

/** 列表/结构化数据用标价：有变体时取选项最低价，否则用 product.price */
export function getListingPriceUsd(product: Product): number {
  if (product.variations?.length) {
    let min = Infinity;
    for (const v of product.variations) {
      for (const o of v.options) {
        if (typeof o.price === "number" && o.price < min) min = o.price;
      }
    }
    if (Number.isFinite(min)) return min;
  }
  return product.price;
}

function availabilitySchemaUrl(product: Product): string {
  if (!product.inStock) return "https://schema.org/OutOfStock";
  if (product.preorder) return "https://schema.org/PreOrder";
  return "https://schema.org/InStock";
}

/** Google 富摘要用的 Product JSON-LD（绝对图片 URL、USD Offer） */
export function buildProductJsonLd(product: Product, slug: string): Record<string, unknown> {
  const base = getSiteUrl();
  const pageUrl = `${base}/products/${slug}`;
  const name = product.name_i18n?.en ?? product.name;
  const description = (product.description_i18n?.en ?? product.description).replace(/\s+/g, " ").trim();
  const imgs = (product.images?.filter(Boolean).length ? product.images! : [product.image]).filter(
    Boolean,
  );
  const imageUrls = imgs.map((im) => absImageUrl(base, im));
  const price = getListingPriceUsd(product);
  const brand = brands.find((b) => b.id === product.brandId);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description.slice(0, 5000),
    sku: product.id,
    url: pageUrl,
    offers: {
      "@type": "Offer",
      url: pageUrl,
      priceCurrency: "USD",
      price: price.toFixed(2),
      availability: availabilitySchemaUrl(product),
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  if (brand) {
    jsonLd.brand = { "@type": "Brand", name: brand.name };
  }
  if (imageUrls.length) {
    jsonLd.image = imageUrls.length === 1 ? imageUrls[0] : imageUrls;
  }

  return jsonLd;
}

/**
 * 与前台面包屑一致：Home → Products → Brand → [Character] → 当前商品（英文标签，主站面向美国买家）
 */
export function buildProductBreadcrumbJsonLd(product: Product, slug: string): Record<string, unknown> {
  const base = getSiteUrl();
  type Crumb = { position: number; name: string; item: string };
  const list: Crumb[] = [];
  let position = 1;
  list.push({ position: position++, name: "Home", item: `${base}/` });
  list.push({ position: position++, name: "Products", item: `${base}/products` });

  const brand = brands.find((b) => b.id === product.brandId);
  if (brand) {
    const qs = new URLSearchParams({ brand: product.brandId });
    list.push({
      position: position++,
      name: brand.name,
      item: `${base}/products?${qs.toString()}`,
    });
  }

  if (product.characterId) {
    const ch = characters.find((c) => c.id === product.characterId);
    if (ch) {
      const qs = new URLSearchParams({
        brand: product.brandId,
        character: product.characterId,
      });
      list.push({
        position: position++,
        name: ch.name,
        item: `${base}/products?${qs.toString()}`,
      });
    }
  }

  const productName = product.name_i18n?.en ?? product.name;
  list.push({
    position,
    name: productName,
    item: `${base}/products/${encodeURIComponent(slug)}`,
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: list.map((it) => ({
      "@type": "ListItem",
      position: it.position,
      name: it.name,
      item: it.item,
    })),
  };
}

export type ProductsListItemListOpts = {
  /** 当前页码（从 1 起） */
  page: number;
  pageSize: number;
  /** 符合筛选的总条数（用于 name 文案） */
  total: number;
};

/**
 * 商品列表页当前页的 ItemList JSON-LD（嵌套迷你 Product：url、主图绝对地址）
 */
export function buildProductsListItemListJsonLd(
  pageProducts: Product[],
  opts: ProductsListItemListOpts,
): Record<string, unknown> | null {
  if (pageProducts.length === 0) return null;
  const base = getSiteUrl();

  const itemListElement = pageProducts.map((p, i) => {
    const name = p.name_i18n?.en ?? p.name;
    const mainImg = (p.images?.filter(Boolean)[0] ?? p.image)?.trim();
    const itemUrl = `${base}/products/${encodeURIComponent(p.slug)}`;
    const mini: Record<string, unknown> = {
      "@type": "Product",
      name,
      url: itemUrl,
    };
    if (mainImg) {
      mini.image = absImageUrl(base, mainImg);
    }
    return {
      "@type": "ListItem",
      position: i + 1,
      name,
      item: mini,
    };
  });

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    /** 与当前 itemListElement 条数一致（分页时每页一条列表） */
    numberOfItems: pageProducts.length,
    itemListElement,
  };

  if (opts.total > pageProducts.length) {
    jsonLd.description = `PrintFig product list — page ${opts.page} of ${Math.max(1, Math.ceil(opts.total / opts.pageSize))} (${opts.total} products match filters).`;
  }

  return jsonLd;
}
