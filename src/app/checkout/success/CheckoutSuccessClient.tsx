"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/components/CartContext";
import { useTranslations } from "@/lib/locale";

type SuccessState = "loading" | "ok" | "missing" | "error" | "unpaid";

function CheckoutSuccessLoadingFallback() {
  const t = useTranslations();
  return (
    <div
      className="mx-auto max-w-lg px-4 py-16 text-center text-zinc-400"
      role="status"
      aria-live="polite"
    >
      {t("checkout.stripeSuccessLoading")}
    </div>
  );
}

function SuccessInner() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const sessionId = searchParams.get("session_id");
  const [state, setState] = useState<SuccessState>("loading");
  const [retryTick, setRetryTick] = useState(0);

  const retry = useCallback(() => setRetryTick((n) => n + 1), []);

  useEffect(() => {
    if (!sessionId) {
      setState("missing");
      return;
    }
    let cancelled = false;
    setState("loading");

    fetch(`/api/stripe/session-status?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (res) => {
        let data: { paymentStatus?: string } = {};
        const raw = await res.text();
        if (raw) {
          try {
            data = JSON.parse(raw) as typeof data;
          } catch {
            throw new Error("parse");
          }
        }
        if (!res.ok) throw new Error("bad");
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        const ps = data.paymentStatus ?? "";
        if (ps === "paid" || ps === "no_payment_required") {
          clearCart();
          setState("ok");
        } else if (ps === "unpaid") {
          setState("unpaid");
        } else {
          setState("error");
        }
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId, clearCart, retryTick]);

  if (state === "missing") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-zinc-400">{t("checkout.stripeSuccessMissing")}</p>
        <Link href="/account/orders" className="btn-primary mt-6 inline-block">
          {t("account.orders")}
        </Link>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div
        className="mx-auto max-w-lg px-4 py-16 text-center text-zinc-400"
        role="status"
        aria-live="polite"
        aria-busy={true}
      >
        {t("checkout.stripeSuccessLoading")}
      </div>
    );
  }

  if (state === "unpaid") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-zinc-300">{t("checkout.stripeSuccessUnpaid")}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/cart" className="btn-secondary inline-block text-center">
            {t("cart.title")}
          </Link>
          <Link href="/account/orders" className="btn-primary inline-block text-center">
            {t("account.orders")}
          </Link>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-zinc-300" role="alert">
          {t("checkout.stripeSuccessError")}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" className="btn-primary" onClick={retry}>
            {t("checkout.stripeSuccessRetry")}
          </button>
          <Link href="/account/orders" className="btn-secondary inline-block text-center">
            {t("account.orders")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"
        aria-hidden
      >
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="mt-6 font-display text-2xl font-bold text-white">{t("checkout.stripeSuccessTitle")}</h1>
      <p className="mt-3 text-sm text-zinc-400">{t("checkout.stripeSuccessBody")}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/account/orders" className="btn-primary inline-block text-center">
          {t("account.orders")}
        </Link>
        <Link href="/products" className="btn-secondary inline-block text-center">
          {t("errorPage.browseProducts")}
        </Link>
      </div>
    </div>
  );
}

export function CheckoutSuccessClient() {
  return (
    <Suspense fallback={<CheckoutSuccessLoadingFallback />}>
      <SuccessInner />
    </Suspense>
  );
}
