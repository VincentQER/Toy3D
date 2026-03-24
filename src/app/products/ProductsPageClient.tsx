"use client";

import { Suspense, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/types";
import type { Product } from "@/lib/types";
import type { Brand } from "@/lib/types";
import type { Character } from "@/lib/types";
import type { ProductListSort } from "@/lib/product-list-url";
import { buildProductsHref } from "@/lib/product-list-url";
import { ProductCard } from "@/components/ProductCard";
import { useTranslations } from "@/lib/locale";

interface ProductsPageClientProps {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  characterOptions: Character[];
  category: string | undefined;
  brand: string | undefined;
  character: string | undefined;
  currentCategory: Category | null;
  currentBrand: Brand | null;
  q: string;
  sort: ProductListSort;
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

export function ProductsPageClient({
  products,
  categories,
  brands,
  characterOptions,
  category,
  brand,
  character,
  currentCategory,
  currentBrand,
  q,
  sort,
  page,
  pageSize,
  total,
  pageCount,
}: ProductsPageClientProps) {
  const t = useTranslations();
  const router = useRouter();

  /** 改筛选 / 排序时回到第 1 页 */
  const filterHref = useCallback(
    (
      patch: Partial<{
        category?: string;
        brand?: string;
        character?: string;
        q?: string;
        sort?: ProductListSort;
      }>,
    ) =>
      buildProductsHref({
        category,
        brand,
        character,
        q,
        sort,
        page: 1,
        ...patch,
      }),
    [category, brand, character, q, sort],
  );

  const pageHref = useCallback(
    (p: number) =>
      buildProductsHref({
        category,
        brand,
        character,
        q,
        sort,
        page: p,
      }),
    [category, brand, character, q, sort],
  );

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const categoryTitle = currentCategory
    ? t(`categories.${currentCategory.id}.name`)
    : t("products.title");
  const filterSubtitle = currentBrand
    ? t(`brands.${currentBrand.id}.description`)
    : currentCategory
      ? t(`categories.${currentCategory.id}.description`)
      : "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">
          {categoryTitle}
          {currentBrand && ` · ${currentBrand.name}`}
        </h1>
        {(currentCategory || currentBrand) && filterSubtitle && (
          <p className="mt-2 text-zinc-400">{filterSubtitle}</p>
        )}
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <form action="/products" method="get" className="flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:items-center">
          {category ? <input type="hidden" name="category" value={category} /> : null}
          {brand ? <input type="hidden" name="brand" value={brand} /> : null}
          {character ? <input type="hidden" name="character" value={character} /> : null}
          {sort !== "newest" ? <input type="hidden" name="sort" value={sort} /> : null}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={t("products.searchPlaceholder")}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
            autoComplete="off"
          />
          <button type="submit" className="btn-primary shrink-0 sm:px-6">
            {t("products.search")}
          </button>
        </form>

        <div className="flex items-center gap-2">
          <label htmlFor="product-sort" className="text-sm font-medium text-zinc-500">
            {t("products.sortLabel")}
          </label>
          <select
            id="product-sort"
            value={sort}
            onChange={(e) => {
              const next = e.target.value as ProductListSort;
              router.push(
                buildProductsHref({
                  category,
                  brand,
                  character,
                  q,
                  sort: next,
                  page: 1,
                }),
              );
            }}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
          >
            <option value="newest">{t("products.sortNewest")}</option>
            <option value="price-asc">{t("products.sortPriceAsc")}</option>
            <option value="price-desc">{t("products.sortPriceDesc")}</option>
            <option value="name">{t("products.sortName")}</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <span className="text-sm font-medium text-zinc-500">{t("products.type")}</span>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            href={filterHref({ category: undefined })}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              !category ? "bg-brand-accent text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {t("products.all")}
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={filterHref({ category: c.id })}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                category === c.id ? "bg-brand-accent text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {t(`categories.${c.id}.name`)}
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <span className="text-sm font-medium text-zinc-500">{t("products.brand")}</span>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            href={filterHref({ brand: undefined, character: undefined })}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              !brand ? "bg-brand-accent text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {t("products.all")}
          </Link>
          {brands.map((b) => (
            <Link
              key={b.id}
              href={filterHref({ brand: b.id, character: undefined })}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                brand === b.id ? "bg-brand-accent text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {b.name}
            </Link>
          ))}
        </div>
      </div>

      {characterOptions.length > 0 && (
        <div className="mb-6">
          <span className="text-sm font-medium text-zinc-500">{t("products.character")}</span>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href={filterHref({ character: undefined })}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                !character ? "bg-zinc-700 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {t("products.all")}
            </Link>
            {characterOptions.map((ch) => (
              <Link
                key={ch.id}
                href={filterHref({ character: ch.id })}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  character === ch.id ? "bg-zinc-700 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {ch.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <Suspense fallback={<div className="text-zinc-400">{t("products.loading")}</div>}>
        {products.length === 0 ? (
          <p className="py-12 text-center text-zinc-500">{t("products.noResults")}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </Suspense>

      {total > 0 && pageCount > 1 ? (
        <nav
          className="mt-10 flex flex-col items-center gap-4 border-t border-zinc-800 pt-8 sm:flex-row sm:justify-between"
          aria-label={t("products.paginationNav")}
        >
          <p className="text-sm text-zinc-500">
            {t("products.paginationSummary")
              .replace("{start}", String(rangeStart))
              .replace("{end}", String(rangeEnd))
              .replace("{total}", String(total))}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className="btn-secondary text-sm">
                {t("products.paginationPrev")}
              </Link>
            ) : (
              <span className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-600">
                {t("products.paginationPrev")}
              </span>
            )}
            <span className="px-2 text-sm text-zinc-400">
              {t("products.paginationPage")
                .replace("{current}", String(page))
                .replace("{total}", String(pageCount))}
            </span>
            {page < pageCount ? (
              <Link href={pageHref(page + 1)} className="btn-secondary text-sm">
                {t("products.paginationNext")}
              </Link>
            ) : (
              <span className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-600">
                {t("products.paginationNext")}
              </span>
            )}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
