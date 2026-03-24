"use client";

import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { brands, characters } from "@/lib/data";
import { getProductMainImage, getProductName, getProductPrice } from "@/lib/product-i18n";
import { useLocale } from "@/lib/locale";
import { useTranslations } from "@/lib/locale";
import { AddToCartButton } from "./AddToCartButton";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { locale } = useLocale();
  const t = useTranslations();
  const name = getProductName(product, locale);
  const mainImage = getProductMainImage(product);
  const hasVariations = product.variations && product.variations.length > 0;
  const displayPrice = getProductPrice(product);

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-brand-card card-hover">
      <Link href={`/products/${product.slug}`} className="relative block aspect-[3/4] overflow-hidden bg-zinc-900">
        <Image
          src={mainImage}
          alt={name}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {product.preorder && (
          <span className="absolute left-3 top-3 rounded-md bg-filament-amber/90 px-2 py-0.5 text-xs font-medium text-black">
            {t("product.preorder")}
          </span>
        )}
        {product.originalPrice && (
          <span className="absolute right-3 top-3 rounded-md bg-red-600/90 px-2 py-0.5 text-xs font-medium text-white">
            -{Math.round((1 - product.price / product.originalPrice) * 100)}%
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-display font-semibold text-white transition group-hover:text-brand-accent">
            {name}
          </h3>
        </Link>
        <p className="mt-0.5 text-xs text-zinc-500">
          {brands.find((b) => b.id === product.brandId)?.name}
          {product.characterId && (
            <> · {characters.find((c) => c.id === product.characterId)?.name}</>
          )}
        </p>
        {product.scale && (
          <p className="mt-0.5 text-xs text-zinc-500">{product.scale} · {product.height}</p>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div className="flex items-baseline gap-2">
            {hasVariations ? (
              <span className="text-lg font-bold text-white">{t("product.from")} ${displayPrice}</span>
            ) : (
              <>
                <span className="text-lg font-bold text-white">${displayPrice}</span>
                {product.originalPrice && (
                  <span className="text-sm text-zinc-500 line-through">${product.originalPrice}</span>
                )}
              </>
            )}
          </div>
          <AddToCartButton product={product} />
        </div>
      </div>
    </article>
  );
}
