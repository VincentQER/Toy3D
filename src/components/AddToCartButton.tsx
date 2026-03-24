"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "./CartContext";
import { useTranslations } from "@/lib/locale";
import type { Product } from "@/lib/types";

interface AddToCartButtonProps {
  product: Product;
  size?: "sm" | "md";
}

export function AddToCartButton({ product, size = "md" }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const t = useTranslations();
  const hasVariations = product.variations && product.variations.length > 0;

  const baseClass = "rounded-lg font-medium transition shrink-0";
  const sizeClass = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm";

  if (hasVariations) {
    return (
      <Link
        href={`/products/${product.slug}`}
        className={`${baseClass} ${sizeClass} btn-secondary inline-block text-center`}
      >
        {t("product.selectOptions")}
      </Link>
    );
  }

  return (
    <AddToCartButtonInner product={product} baseClass={baseClass} sizeClass={sizeClass} />
  );
}

function AddToCartButtonInner({
  product,
  baseClass,
  sizeClass,
}: {
  product: Product;
  baseClass: string;
  sizeClass: string;
}) {
  const { addToCart } = useCart();
  const t = useTranslations();
  const [added, setAdded] = useState(false);
  const handleClick = () => {
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${baseClass} ${sizeClass} ${
        added ? "bg-emerald-600 text-white" : "btn-primary"
      }`}
      disabled={!product.inStock && !product.preorder}
    >
      {added ? t("product.added") : product.inStock || product.preorder ? t("product.addToCart") : t("product.outOfStock")}
    </button>
  );
}
