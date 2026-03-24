"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/CartContext";
import { CartOutlineIcon } from "@/components/CartOutlineIcon";
import { getProductMainImage, getProductName } from "@/lib/product-i18n";
import { useLocale, useTranslations } from "@/lib/locale";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, totalItems, totalPrice, getItemId } = useCart();
  const { locale } = useLocale();
  const t = useTranslations();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <div className="mx-auto max-w-md rounded-2xl border border-zinc-800 bg-brand-card/90 px-8 py-12 shadow-xl shadow-black/20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/80 text-zinc-500">
            <CartOutlineIcon className="h-9 w-9" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-bold text-white">{t("cart.empty")}</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">{t("cart.emptySubtitle")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/products" className="btn-primary inline-block text-center">
              {t("cart.shopNow")}
            </Link>
            <Link href="/" className="btn-secondary inline-block text-center">
              {t("cart.backHome")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-white">{t("cart.title")}</h1>

      <div className="mt-8 lg:grid lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2">
          <ul className="divide-y divide-zinc-800">
            {items.map((item) => {
              const itemId = getItemId(item);
              const price = item.selectedVariant ? item.selectedVariant.price : item.product.price;
              const name = getProductName(item.product, locale);
              const variantLabel = item.selectedVariant
                ? `${item.selectedVariant.variationName}: ${item.selectedVariant.optionLabel}`
                : null;
              return (
                <li key={itemId} className="flex gap-4 py-6">
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
                    <Image
                      src={getProductMainImage(item.product)}
                      alt={name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="font-medium text-white hover:text-brand-accent"
                    >
                      {name}
                    </Link>
                    {variantLabel && (
                      <p className="mt-0.5 text-xs text-zinc-500">{variantLabel}</p>
                    )}
                    <p className="mt-0.5 text-sm text-zinc-500">
                      ${price} × {item.quantity}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(itemId, item.quantity - 1)}
                        aria-label={t("cart.decreaseQty")}
                        className="flex h-8 w-8 items-center justify-center rounded border border-zinc-600 text-zinc-400 hover:border-zinc-500 hover:text-white"
                      >
                        <span aria-hidden>−</span>
                      </button>
                      <span className="w-8 text-center text-white" aria-live="polite">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(itemId, item.quantity + 1)}
                        aria-label={t("cart.increaseQty")}
                        className="flex h-8 w-8 items-center justify-center rounded border border-zinc-600 text-zinc-400 hover:border-zinc-500 hover:text-white"
                      >
                        <span aria-hidden>+</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(itemId)}
                        className="ml-2 text-sm text-zinc-500 hover:text-red-400"
                      >
                        {t("cart.remove")}
                      </button>
                    </div>
                  </div>
                  <div className="text-right font-medium text-white">
                    ${price * item.quantity}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-8 lg:mt-0">
          <div className="rounded-xl border border-zinc-800 bg-brand-card p-6">
            <h2 className="font-display text-lg font-semibold text-white">{t("cart.orderSummary")}</h2>
            <div className="mt-4 flex justify-between text-zinc-400">
              <span>
                {totalItems} {t("cart.items")}
              </span>
              <span>${totalPrice}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-zinc-800 pt-4 text-white">
              <span>{t("cart.subtotal")}</span>
              <span className="text-xl font-bold">${totalPrice}</span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">{t("cart.shippingNote")}</p>
            <Link
              href="/checkout"
              className="btn-primary mt-6 block w-full text-center"
            >
              {t("cart.checkout")}
            </Link>
            <Link
              href="/products"
              className="mt-3 block text-center text-sm text-zinc-400 hover:text-white"
            >
              {t("cart.continueShopping")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
