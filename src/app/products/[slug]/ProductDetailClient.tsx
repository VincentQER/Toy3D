"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product, SelectedVariant } from "@/lib/types";
import { getProductName, getProductDescription, getProductPrice, getProductGallery } from "@/lib/product-i18n";
import { useCart } from "@/components/CartContext";
import { useLocale, useTranslations } from "@/lib/locale";
import { brands, characters } from "@/lib/data";

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { addToCart } = useCart();
  const { locale } = useLocale();
  const t = useTranslations();
  const gallery = getProductGallery(product);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<SelectedVariant | null>(null);
  const [added, setAdded] = useState(false);

  const hasVariations = product.variations && product.variations.length > 0;
  const displayPrice = getProductPrice(product, selectedVariant);
  const name = getProductName(product, locale);
  const description = getProductDescription(product, locale);

  const handleAddToCart = () => {
    if (hasVariations && !selectedVariant) {
      alert(t("product.selectVariant"));
      return;
    }
    addToCart(product, 1, selectedVariant ?? undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      {/* Image gallery */}
      <div className="space-y-3 max-w-md mx-auto lg:mx-2">
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <Image
            src={gallery[selectedImageIndex] ?? gallery[0]!}
            alt={name}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {product.preorder && (
            <span className="absolute left-4 top-4 rounded-md bg-filament-amber/90 px-3 py-1 text-sm font-medium text-black">
              {t("product.preorder")}
            </span>
          )}
          {product.domesticOnly && (
            <span className="absolute right-4 top-4 rounded-md bg-zinc-700/90 px-3 py-1 text-xs text-zinc-200">
              {t("product.usOnly")}
            </span>
          )}
        </div>
        {gallery.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {gallery.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedImageIndex(i)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                  selectedImageIndex === i ? "border-brand-accent" : "border-zinc-700"
                }`}
              >
                <Image src={url} alt="" fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h1 className="font-display text-3xl font-bold text-white">{name}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {hasVariations && !selectedVariant && (
            <span className="text-xl font-bold text-white">{t("product.from")} ${product.price}</span>
          )}
          {(!hasVariations || selectedVariant) && (
            <span className="text-2xl font-bold text-white">${displayPrice}</span>
          )}
          {product.originalPrice && displayPrice < product.originalPrice && (
            <span className="text-lg text-zinc-500 line-through">${product.originalPrice}</span>
          )}
          {product.preorder && product.preorderEndDate && (
            <span className="text-sm text-zinc-500">{t("product.preorderEnds")}: {product.preorderEndDate}</span>
          )}
        </div>

        {/* Variation selectors (eBay-style) */}
        {hasVariations && product.variations!.map((v) => (
          <div key={v.name} className="mt-6" role="group" aria-label={v.name}>
            <span className="block text-sm font-medium text-zinc-400">{v.name}</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {v.options.map((opt) => {
                const isSelected =
                  selectedVariant?.variationName === v.name && selectedVariant?.optionLabel === opt.label;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={`${v.name}: ${opt.label}, $${opt.price}`}
                    onClick={() =>
                      setSelectedVariant({
                        variationName: v.name,
                        optionLabel: opt.label,
                        price: opt.price,
                        sku: opt.sku,
                      })
                    }
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                      isSelected
                        ? "border-brand-accent bg-brand-accent/20 text-white"
                        : "border-zinc-600 text-zinc-300 hover:border-zinc-500"
                    }`}
                  >
                    {opt.label} — ${opt.price}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <p className="mt-6 text-zinc-400">{description}</p>

        <dl className="mt-6 space-y-2 border-t border-zinc-800 pt-6">
          {product.scale && (
            <>
              <dt className="text-sm text-zinc-500">{t("product.scale")}</dt>
              <dd className="text-white">{product.scale}</dd>
            </>
          )}
          {product.material && (
            <>
              <dt className="text-sm text-zinc-500">{t("product.material")}</dt>
              <dd className="text-white">{product.material}</dd>
            </>
          )}
          {product.height && (
            <>
              <dt className="text-sm text-zinc-500">{t("product.height")}</dt>
              <dd className="text-white">{product.height}</dd>
            </>
          )}
        </dl>

        <div className="mt-8 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={(!product.inStock && !product.preorder) || (hasVariations && !selectedVariant)}
            className={added ? "rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white" : "btn-primary"}
          >
            {added ? t("product.added") : product.inStock || product.preorder ? t("product.addToCart") : t("product.outOfStock")}
          </button>
          <Link href="/products" className="btn-secondary">
            {t("product.continueShopping")}
          </Link>
        </div>

        {!product.inStock && !product.preorder && (
          <p className="mt-4 text-sm text-amber-400">{t("product.outOfStockNotice")}</p>
        )}
      </div>
    </div>
  );
}
