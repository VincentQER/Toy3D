import type { Metadata } from "next";
import { categories, brands, getCharactersByBrand } from "@/lib/data";
import { filterProductsPaged } from "@/lib/server-data";
import {
  parseProductListSort,
  parseProductsListPage,
  PRODUCTS_PAGE_SIZE,
} from "@/lib/product-list-url";
import { buildProductsListItemListJsonLd } from "@/lib/product-jsonld";
import { ProductsPageClient } from "./ProductsPageClient";

interface PageProps {
  searchParams: Promise<{
    category?: string;
    brand?: string;
    character?: string;
    q?: string;
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q, category, brand, page: pageParam } = await searchParams;
  const query = q?.trim();
  const page = parseProductsListPage(pageParam);
  const bits: string[] = [];
  if (query) bits.push(`“${query.slice(0, 40)}${query.length > 40 ? "…" : ""}”`);
  if (category) {
    const c = categories.find((x) => x.id === category);
    if (c) bits.push(c.name);
  }
  if (brand) {
    const b = brands.find((x) => x.id === brand);
    if (b) bits.push(b.name);
  }
  if (page > 1) bits.push(`Page ${page}`);
  const titleSegment = bits.length > 0 ? bits.join(" · ") : "Products";
  const titleForSocial = `${titleSegment} | PrintFig`;
  const description =
    query || category || brand
      ? `Browse 3D printed figures and collectibles${query ? ` matching your search` : ""}. PrintFig — action figures, statues & pre-orders.`
      : "Browse 3D printed action figures, statues and pre-order collectibles. Marvel, DC, Sonic and more at PrintFig.";

  return {
    title: titleSegment,
    description,
    openGraph: {
      title: titleForSocial,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: titleForSocial,
      description,
    },
  };
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const { category, brand, character, q, sort: sortParam, page: pageParam } = await searchParams;
  const sort = parseProductListSort(sortParam);
  const qTrimmed = q?.trim() ?? "";

  const pageSize = PRODUCTS_PAGE_SIZE;
  let page = parseProductsListPage(pageParam);
  const listFilters = {
    category: category ?? undefined,
    brand: brand ?? undefined,
    character: character ?? undefined,
    q: qTrimmed || undefined,
    sort,
  };

  let { products, total } = await filterProductsPaged(listFilters, page, pageSize);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (page > pageCount) {
    page = pageCount;
    ({ products, total } = await filterProductsPaged(listFilters, page, pageSize));
  }
  const currentCategory = category ? (categories.find((c) => c.id === category) ?? null) : null;
  const currentBrand = brand ? (brands.find((b) => b.id === brand) ?? null) : null;
  const characterOptions =
    currentBrand && currentBrand.id ? getCharactersByBrand(currentBrand.id) : [];

  const itemListJsonLd = buildProductsListItemListJsonLd(products, {
    page,
    pageSize,
    total,
  });

  return (
    <>
      {itemListJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      ) : null}
      <ProductsPageClient
      products={products}
      categories={categories}
      brands={brands}
      characterOptions={characterOptions}
      category={category}
      brand={brand}
      character={character}
      currentCategory={currentCategory}
      currentBrand={currentBrand}
      q={qTrimmed}
      sort={sort}
      page={page}
      pageSize={pageSize}
      total={total}
      pageCount={pageCount}
    />
    </>
  );
}
