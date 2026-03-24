"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/CartContext";
import { useAuth } from "@/components/AuthContext";
import { CartOutlineIcon } from "@/components/CartOutlineIcon";
import { getProductName } from "@/lib/product-i18n";
import { useLocale, useTranslations } from "@/lib/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { checkoutErrorTranslationKey } from "@/components/checkout-api-error";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { isLoggedIn } = useAuth();
  const { locale } = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [stripeEnabled, setStripeEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/stripe/config")
      .then((r) => r.json())
      .then((d: { enabled?: boolean }) => setStripeEnabled(!!d.enabled))
      .catch(() => setStripeEnabled(false));
  }, []);

  useEffect(() => {
    if (items.length === 0 || !isLoggedIn) return;
    fetch("/api/account/addresses")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { name: string; phone: string; address: string; isDefault: boolean }[]) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const def = data.find((a) => a.isDefault) ?? data[0];
        setName(def.name);
        setPhone(def.phone);
        const parts = def.address.split(",").map((p) => p.trim()).filter(Boolean);
        setStreet(parts[0] ?? "");
        if (parts.length === 4) {
          setCity(parts[1] ?? "");
          setStateRegion(parts[2] ?? "");
          setPostalCode(parts[3] ?? "");
        } else if (parts.length === 3) {
          setCity(parts[0] ?? "");
          setStateRegion(parts[1] ?? "");
          setPostalCode(parts[2] ?? "");
        }
      })
      .catch(() => {});
  }, [items.length, isLoggedIn]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <div className="mx-auto max-w-md rounded-2xl border border-zinc-800 bg-brand-card/90 px-8 py-12 shadow-xl shadow-black/20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/80 text-zinc-500">
            <CartOutlineIcon className="h-9 w-9" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-bold text-white">{t("checkout.empty")}</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">{t("checkout.emptySubtitle")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/products" className="btn-primary inline-block text-center">
              {t("checkout.goShop")}
            </Link>
            <Link href="/cart" className="btn-secondary inline-block text-center">
              {t("cart.title")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <div className="mx-auto max-w-md rounded-2xl border border-zinc-800 bg-brand-card/90 px-8 py-12 shadow-xl shadow-black/20">
          <h1 className="font-display text-2xl font-bold text-white">{t("checkout.title")}</h1>
          <p className="mt-3 text-zinc-300">{t("checkout.loginRequired")}</p>
          <p className="mt-2 text-sm text-zinc-500">{t("checkout.loginSubtitle")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={`/login?redirect=${encodeURIComponent("/checkout")}`} className="btn-primary inline-block text-center">
              {t("login.submit")}
            </Link>
            <Link
              href={`/register?redirect=${encodeURIComponent("/checkout")}`}
              className="btn-secondary inline-block text-center"
            >
              {t("checkout.goRegister")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const shippingAddress = [street, city, stateRegion, postalCode].filter(Boolean).join(", ");
    const orderItems = items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      selectedVariant: item.selectedVariant ?? undefined,
    }));
    try {
      if (stripeEnabled) {
        const res = await fetch("/api/stripe/checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: orderItems,
            shippingName: name,
            shippingPhone: phone,
            shippingAddress,
          }),
        });
        const raw = await res.text();
        let data: { error?: string; url?: string } = {};
        if (raw) {
          try {
            data = JSON.parse(raw) as typeof data;
          } catch {
            setError(t("checkout.errorNetwork"));
            return;
          }
        }
        if (!res.ok) {
          setError(t(checkoutErrorTranslationKey(data.error, res.status)));
          return;
        }
        if (!data.url) {
          setError(t("checkout.errorGeneric"));
          return;
        }
        window.location.href = data.url;
        return;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: orderItems,
          shippingName: name,
          shippingPhone: phone,
          shippingAddress,
        }),
      });
      const raw = await res.text();
      let data: { error?: string; orderId?: string; confirmationEmailSent?: boolean } = {};
      if (raw) {
        try {
          data = JSON.parse(raw) as typeof data;
        } catch {
          setError(t("checkout.errorNetwork"));
          return;
        }
      }
      if (!res.ok) {
        setError(t(checkoutErrorTranslationKey(data.error, res.status)));
        return;
      }
      if (!data.orderId) {
        setError(t("checkout.errorGeneric"));
        return;
      }
      clearCart();
      const qs = new URLSearchParams({ created: data.orderId });
      if (data.confirmationEmailSent) qs.set("emailed", "1");
      router.push(`/account/orders?${qs.toString()}`);
    } catch {
      setError(t("checkout.errorNetwork"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-white">{t("checkout.title")}</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-6"
        aria-busy={submitting || stripeEnabled === null}
      >
        {error ? (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {error}
          </div>
        ) : null}
        <div className="rounded-xl border border-zinc-800 bg-brand-card p-6">
          <h2 className="font-display text-lg font-semibold text-white">{t("checkout.shippingInfo")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-zinc-400">{t("checkout.name")}</label>
              <input
                name="shippingName"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
                placeholder={t("checkout.namePlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400">{t("checkout.phone")}</label>
              <input
                name="shippingPhone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm text-zinc-400">{t("checkout.address")}</label>
            <input
              name="shippingStreet"
              type="text"
              required
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
              placeholder={t("checkout.addressPlaceholder")}
            />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm text-zinc-400">{t("checkout.city")}</label>
              <input
                name="shippingCity"
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400">{t("checkout.stateRegion")}</label>
              <input
                name="shippingState"
                type="text"
                required
                value={stateRegion}
                onChange={(e) => setStateRegion(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400">{t("checkout.postalCode")}</label>
              <input
                name="shippingZip"
                type="text"
                required
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-brand-card p-6">
          <h2 className="font-display text-lg font-semibold text-white">{t("checkout.orderTotal")}</h2>
          <ul className="mt-4 space-y-2 text-sm text-zinc-400">
            {items.map((item) => {
              const price = item.selectedVariant ? item.selectedVariant.price : item.product.price;
              const name = getProductName(item.product, locale);
              const variantLabel = item.selectedVariant
                ? ` (${item.selectedVariant.variationName}: ${item.selectedVariant.optionLabel})`
                : "";
              return (
                <li key={item.product.id + (item.selectedVariant?.optionLabel ?? "")} className="flex justify-between gap-4">
                  <span className="min-w-0 break-words">
                    {name}
                    {variantLabel} × {item.quantity}
                  </span>
                  <span className="shrink-0">${price * item.quantity}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 space-y-2 border-t border-zinc-800 pt-4 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>{t("checkout.subtotal")}</span>
              <span>${totalPrice}</span>
            </div>
            <div className="flex justify-between text-zinc-500">
              <span>{t("checkout.shippingEstimate")}</span>
              <span className="text-zinc-500">{t("checkout.shippingPending")}</span>
            </div>
          </div>
          <p className="mt-3 rounded-lg border border-zinc-700/80 bg-brand-dark/50 p-3 text-xs leading-relaxed text-zinc-500">
            {t("checkout.shippingDetail")}
          </p>
          <div className="mt-4 flex justify-between border-t border-zinc-800 pt-4 text-white">
            <span className="font-medium">{t("cart.total")}</span>
            <span className="text-xl font-bold">${totalPrice}</span>
          </div>
          <p className="mt-2 text-xs text-zinc-600">{t("checkout.totalFootnote")}</p>
        </div>

        {stripeEnabled ? (
          <p className="text-xs text-zinc-500">{t("checkout.payWithCardSub")}</p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <button
            type="submit"
            disabled={submitting || stripeEnabled === null}
            className="btn-primary flex-1 sm:order-1"
          >
            {submitting
              ? stripeEnabled
                ? t("checkout.payWithCardLoading")
                : t("checkout.submitting")
              : stripeEnabled === null
                ? t("checkout.checkoutOptionsLoading")
                : stripeEnabled
                  ? t("checkout.payWithCard")
                  : t("checkout.submit")}
          </button>
          <Link href="/cart" className="btn-secondary">
            {t("checkout.backToCart")}
          </Link>
        </div>
      </form>
    </div>
  );
}
