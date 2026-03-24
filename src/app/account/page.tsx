"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { useTranslations } from "@/lib/locale";

export default function AccountDashboardPage() {
  const { user } = useAuth();
  const t = useTranslations();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">{t("account.overview")}</h1>
      <p className="mt-2 text-zinc-400">{t("account.welcome")} {user?.name ?? user?.email}.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Link
          href="/account/orders"
          className="rounded-xl border border-zinc-800 bg-brand-card p-6 transition hover:border-brand-accent/50"
        >
          <h2 className="font-semibold text-white">{t("account.orders")}</h2>
          <p className="mt-1 text-sm text-zinc-500">{t("account.ordersDesc")}</p>
        </Link>
        <Link
          href="/account/addresses"
          className="rounded-xl border border-zinc-800 bg-brand-card p-6 transition hover:border-brand-accent/50"
        >
          <h2 className="font-semibold text-white">{t("account.addresses")}</h2>
          <p className="mt-1 text-sm text-zinc-500">{t("account.addressesDesc")}</p>
        </Link>
        <Link
          href="/account/profile"
          className="rounded-xl border border-zinc-800 bg-brand-card p-6 transition hover:border-brand-accent/50"
        >
          <h2 className="font-semibold text-white">{t("account.profile")}</h2>
          <p className="mt-1 text-sm text-zinc-500">{t("account.profileDesc")}</p>
        </Link>
      </div>
    </div>
  );
}
