"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "@/lib/locale";
import { buildCarrierTrackingUrl } from "@/lib/shipping-tracking";

interface Order {
  id: string;
  date: string;
  total: number;
  status: string;
  trackingNumber: string | null;
  carrier: string | null;
}

function statusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-amber-500/15 text-amber-100 ring-1 ring-amber-500/35";
    case "paid":
      return "bg-sky-500/15 text-sky-100 ring-1 ring-sky-500/35";
    case "shipped":
      return "bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-500/35";
    case "delivered":
      return "bg-teal-500/15 text-teal-100 ring-1 ring-teal-500/35";
    case "cancelled":
      return "bg-red-500/15 text-red-100 ring-1 ring-red-500/35";
    default:
      return "bg-zinc-700/80 text-zinc-200 ring-1 ring-zinc-600";
  }
}

function AccountOrdersContent() {
  const { locale } = useLocale();
  const t = useTranslations();
  const searchParams = useSearchParams();
  const createdId = searchParams.get("created");
  const emailed = searchParams.get("emailed") === "1";
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const dateLocaleTag = locale === "zh" ? "zh-CN" : locale === "es" ? "es-US" : "en-US";
  const formatOrderDate = useCallback(
    (isoDate: string) => {
      try {
        const d = new Date(`${isoDate}T12:00:00`);
        if (Number.isNaN(d.getTime())) return isoDate;
        return new Intl.DateTimeFormat(dateLocaleTag, { dateStyle: "medium" }).format(d);
      } catch {
        return isoDate;
      }
    },
    [dateLocaleTag],
  );

  const loadOrders = useCallback(() => {
    setLoading(true);
    setLoadError(false);
    fetch("/api/orders/user")
      .then(async (res) => {
        if (!res.ok) {
          setLoadError(true);
          return [];
        }
        const data = (await res.json()) as unknown;
        return Array.isArray(data) ? (data as Order[]) : [];
      })
      .then((list) => setOrders(list))
      .catch(() => {
        setLoadError(true);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const orderStatusKeys = {
    pending: "accountOrders.statusPending",
    paid: "accountOrders.statusPaid",
    shipped: "accountOrders.statusShipped",
    delivered: "accountOrders.statusDelivered",
    cancelled: "accountOrders.statusCancelled",
  } as const;

  const statusLabel = (status: string) => {
    const trKey = orderStatusKeys[status.toLowerCase() as keyof typeof orderStatusKeys];
    return trKey ? t(trKey) : status;
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">{t("accountOrders.title")}</h1>
      <p className="mt-2 text-zinc-400">{t("accountOrders.desc")}</p>
      {createdId && (
        <div
          className="mt-6 rounded-2xl border border-emerald-500/35 bg-gradient-to-br from-emerald-500/15 to-brand-card p-6 shadow-lg shadow-emerald-500/5"
          role="status"
        >
          <p className="font-display text-xl font-semibold text-emerald-100">
            {t("accountOrders.orderSuccessTitle")}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">{t("accountOrders.orderSuccessSubtitle")}</p>
          <p className="mt-5 font-mono text-sm text-white">
            <span className="text-zinc-500">{t("accountOrders.orderSuccessRef")}: </span>
            <span className="text-emerald-200">#{createdId.slice(0, 8)}</span>
          </p>
          {emailed ? (
            <div className="mt-4 rounded-lg border border-zinc-700/80 bg-brand-dark/50 px-4 py-3">
              <p className="text-sm text-emerald-200/95">{t("accountOrders.orderSuccessEmailLine")}</p>
              <p className="mt-1 text-xs text-zinc-500">{t("accountOrders.orderSuccessEmailSpam")}</p>
            </div>
          ) : null}
          <p className="mt-4 text-xs text-zinc-500">{t("accountOrders.orderSuccessHint")}</p>
        </div>
      )}

      <div className="mt-8">
        {loading ? (
          <div
            className="rounded-xl border border-zinc-800 bg-brand-card p-8 text-center text-zinc-500"
            role="status"
            aria-live="polite"
            aria-busy={true}
          >
            {t("accountOrders.loading")}
          </div>
        ) : loadError ? (
          <div
            className="rounded-xl border border-red-500/30 bg-red-500/5 p-8 text-center"
            role="alert"
            aria-live="polite"
          >
            <p className="text-sm text-red-200/95">{t("accountOrders.loadError")}</p>
            <button type="button" className="btn-primary mt-4" onClick={loadOrders}>
              {t("accountOrders.retry")}
            </button>
          </div>
        ) : orders.length === 0 ? (
          <p className="rounded-xl border border-zinc-800 bg-brand-card p-8 text-center text-zinc-500">
            {t("accountOrders.noOrders")}{" "}
            <Link href="/products" className="text-brand-accent hover:underline">
              {t("accountOrders.goShop")}
            </Link>
          </p>
        ) : (
          <ul className="space-y-4" aria-label={t("accountOrders.title")}>
            {orders.map((order) => {
              const trackingHref = order.trackingNumber
                ? buildCarrierTrackingUrl(order.carrier, order.trackingNumber)
                : null;
              const canTrack = Boolean(trackingHref && trackingHref !== "#");

              return (
                <li
                  key={order.id}
                  className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-brand-card p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-white">{order.id}</span>
                    <span className="ml-3 text-sm text-zinc-500">{formatOrderDate(order.date)}</span>
                  </div>
                  <div className="flex flex-col items-stretch gap-2 sm:items-end">
                    <span className="text-zinc-400 sm:text-right">${order.total}</span>
                    <span
                      className={`inline-flex w-fit max-w-full rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(order.status)}`}
                    >
                      {statusLabel(order.status)}
                    </span>
                    {order.trackingNumber ? (
                      <div className="text-left text-xs text-zinc-400 sm:text-right">
                        <span className="block font-mono text-zinc-300">{order.trackingNumber}</span>
                        {order.carrier ? (
                          <span className="mt-0.5 block text-zinc-500">{order.carrier}</span>
                        ) : null}
                        {canTrack ? (
                          <a
                            href={trackingHref!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-brand-accent hover:underline"
                          >
                            <span>
                              {t("accountOrders.track")}
                              <span className="sr-only"> — {t("accountOrders.trackOpensNewTab")}</span>
                            </span>
                            <span aria-hidden>→</span>
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function AccountOrdersSuspenseFallback() {
  const t = useTranslations();
  return (
    <div className="text-zinc-400" role="status" aria-live="polite">
      {t("accountOrders.loading")}
    </div>
  );
}

export default function AccountOrdersPage() {
  return (
    <Suspense fallback={<AccountOrdersSuspenseFallback />}>
      <AccountOrdersContent />
    </Suspense>
  );
}
