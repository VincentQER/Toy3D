import "server-only";
import type { Prisma } from "@prisma/client";
import type { Product } from "./types";
import type { ProductListSort } from "./product-list-url";
import { prisma } from "./db";

function mapDbToProduct(row: {
  source: string;
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  image: string;
  images: string | null;
  category: string;
  brandId: string;
  characterId: string | null;
  description: string;
  inStock: boolean;
  preorder: boolean;
  preorderEndDate: string | null;
  scale: string | null;
  material: string | null;
  height: string | null;
  nameI18n: string | null;
  descriptionI18n: string | null;
  variations: string | null;
  domesticOnly: boolean;
  createdAt: Date;
}): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    price: row.price,
    originalPrice: row.originalPrice ?? undefined,
    image: row.image,
    images: row.images ? (JSON.parse(row.images) as string[]) : undefined,
    category: row.category as Product["category"],
    brandId: row.brandId as Product["brandId"],
    characterId: row.characterId ?? undefined,
    description: row.description,
    inStock: row.inStock,
    preorder: row.preorder,
    preorderEndDate: row.preorderEndDate ?? undefined,
    scale: row.scale ?? undefined,
    material: row.material ?? undefined,
    height: row.height ?? undefined,
    name_i18n: row.nameI18n ? (JSON.parse(row.nameI18n) as Product["name_i18n"]) : undefined,
    description_i18n: row.descriptionI18n ? (JSON.parse(row.descriptionI18n) as Product["description_i18n"]) : undefined,
    variations: row.variations ? (JSON.parse(row.variations) as Product["variations"]) : undefined,
    domesticOnly: row.domesticOnly,
    source: row.source as "default" | "custom",
    createdAt: row.createdAt.toISOString(),
  };
}

/** 列表排序用：有变体时取各选项最低价，否则 base price */
function getListingSortPrice(product: Product): number {
  if (product.variations?.length) {
    let min = Infinity;
    for (const v of product.variations) {
      for (const o of v.options) {
        if (o.price < min) min = o.price;
      }
    }
    if (min !== Infinity) return min;
  }
  return product.price;
}

/** 类型 / 品牌 / 角色 → Prisma where（未选或 all 则不限制） */
function buildProductListWhere(filters: {
  category?: string;
  brand?: string;
  character?: string;
}): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};
  if (filters.category && filters.category !== "all") {
    where.category = filters.category;
  }
  if (filters.brand && filters.brand !== "all") {
    where.brandId = filters.brand;
  }
  if (filters.character && filters.character !== "all") {
    where.characterId = filters.character;
  }
  return where;
}

/** 关键词：任一主字段 / slug / i18n JSON 字符串包含即命中（SQLite LIKE 对 ASCII 多为不区分大小写） */
function buildProductTextSearchWhere(q: string): Prisma.ProductWhereInput {
  const needle = q.trim();
  if (!needle) return {};
  return {
    OR: [
      { name: { contains: needle } },
      { description: { contains: needle } },
      { slug: { contains: needle } },
      { nameI18n: { contains: needle } },
      { descriptionI18n: { contains: needle } },
    ],
  };
}

/** 合并类型/品牌/角色与可选关键词 */
function buildCombinedProductListWhere(filters: {
  category?: string;
  brand?: string;
  character?: string;
  q?: string;
}): Prisma.ProductWhereInput {
  const base = buildProductListWhere(filters);
  const rawQ = filters.q?.trim();
  const text = rawQ ? buildProductTextSearchWhere(rawQ) : null;
  const parts: Prisma.ProductWhereInput[] = [];
  if (Object.keys(base).length > 0) parts.push(base);
  if (text && Object.keys(text).length > 0) parts.push(text);
  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0]!;
  return { AND: parts };
}

/** 仅内存排序（变体最低价、名称、上架时间） */
function sortProductsInMemory(products: Product[], sort: ProductListSort): Product[] {
  const sorted = [...products];
  switch (sort) {
    case "price-asc":
      sorted.sort((a, b) => getListingSortPrice(a) - getListingSortPrice(b));
      break;
    case "price-desc":
      sorted.sort((a, b) => getListingSortPrice(b) - getListingSortPrice(a));
      break;
    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
      break;
    case "newest":
    default:
      sorted.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
  }
  return sorted;
}

/**
 * 分页：排序为「最新 / 名称」时用 DB `count` + `skip`/`take`（关键词已进 `where`）；
 * 按价格排序时在 DB `where` 后拉齐匹配行，内存按展示价排序再切片。
 */
export async function filterProductsPaged(
  filters: {
    category?: string;
    brand?: string;
    character?: string;
    q?: string;
    sort?: ProductListSort;
  },
  page: number,
  pageSize: number,
): Promise<{ products: Product[]; total: number }> {
  const sort: ProductListSort = filters.sort ?? "newest";
  const where = buildCombinedProductListWhere(filters);
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * pageSize;

  if (sort === "newest" || sort === "name") {
    const orderBy =
      sort === "name"
        ? ({ name: "asc" } satisfies Prisma.ProductOrderByWithRelationInput)
        : ({ createdAt: "desc" } satisfies Prisma.ProductOrderByWithRelationInput);

    const [total, rows] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
    ]);

    return {
      products: rows.map(mapDbToProduct),
      total,
    };
  }

  const rows = await prisma.product.findMany({ where });
  const sorted = sortProductsInMemory(rows.map(mapDbToProduct), sort);
  const total = sorted.length;
  return {
    products: sorted.slice(skip, skip + pageSize),
    total,
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map(mapDbToProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const row = await prisma.product.findUnique({ where: { slug } });
  return row ? mapDbToProduct(row) : undefined;
}

/** 返回全部匹配结果（无分页）；关键词走 Prisma OR `contains`，排序在内存 */
export async function filterProducts(filters: {
  category?: string;
  brand?: string;
  character?: string;
  q?: string;
  sort?: ProductListSort;
}): Promise<Product[]> {
  const where = buildCombinedProductListWhere(filters);
  const rows = await prisma.product.findMany({ where });
  return sortProductsInMemory(rows.map(mapDbToProduct), filters.sort ?? "newest");
}

export async function getCustomProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({ where: { source: "custom" } });
  return rows.map(mapDbToProduct);
}
