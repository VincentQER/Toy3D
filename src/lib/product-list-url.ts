/** 商品列表排序（与 filterProducts 一致） */
export type ProductListSort = "newest" | "price-asc" | "price-desc" | "name";

/** 每页条数（与 products 页服务端切片一致） */
export const PRODUCTS_PAGE_SIZE = 24;

export function parseProductListSort(value: string | undefined): ProductListSort {
  if (value === "price-asc" || value === "price-desc" || value === "name") return value;
  return "newest";
}

/** 解析 ?page=，非法或缺失时为 1 */
export function parseProductsListPage(value: string | undefined): number {
  const n = parseInt(String(value ?? "1"), 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

/** 构建 /products 查询链接，保留筛选、搜索、排序、分页（仅 page>1 写入 URL） */
export function buildProductsHref(parts: {
  category?: string;
  brand?: string;
  character?: string;
  q?: string;
  sort?: ProductListSort;
  page?: number;
}): string {
  const params = new URLSearchParams();
  if (parts.category) params.set("category", parts.category);
  if (parts.brand) params.set("brand", parts.brand);
  if (parts.character) params.set("character", parts.character);
  const q = parts.q?.trim();
  if (q) params.set("q", q);
  if (parts.sort && parts.sort !== "newest") params.set("sort", parts.sort);
  const page = parts.page;
  if (page != null && page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/products?${qs}` : "/products";
}
