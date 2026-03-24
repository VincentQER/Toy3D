"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import { getProductName } from "@/lib/product-i18n";
import { useLocale, useTranslations } from "@/lib/locale";
import { brands, characters } from "@/lib/data";

export function ProductBreadcrumb({ product }: { product: Product }) {
  const { locale } = useLocale();
  const t = useTranslations();
  const name = getProductName(product, locale);

  return (
    <nav className="mb-6 flex flex-wrap items-center gap-x-2 text-sm text-zinc-500">
      <Link href="/products" className="hover:text-white">{t("products.title")}</Link>
      <span>/</span>
      <Link href={`/products?brand=${product.brandId}`} className="hover:text-white">
        {brands.find((b) => b.id === product.brandId)?.name}
      </Link>
      {product.characterId && (
        <>
          <span>/</span>
          <Link
            href={`/products?brand=${product.brandId}&character=${product.characterId}`}
            className="hover:text-white"
          >
            {characters.find((c) => c.id === product.characterId)?.name}
          </Link>
        </>
      )}
      <span>/</span>
      <span className="text-zinc-300">{name}</span>
    </nav>
  );
}
