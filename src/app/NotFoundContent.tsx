"use client";

import Link from "next/link";
import { useTranslations } from "@/lib/locale";

export function NotFoundContent() {
  const t = useTranslations();

  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center px-4 py-16">
      <p className="font-display text-6xl font-bold tabular-nums text-brand-accent/90 sm:text-7xl">
        {t("errorPage.code404")}
      </p>
      <h1 className="mt-4 font-display text-2xl font-semibold text-white sm:text-3xl">
        {t("errorPage.notFoundTitle")}
      </h1>
      <p className="mt-4 max-w-md text-center text-sm leading-relaxed text-zinc-400">
        {t("errorPage.notFoundDesc")}
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link href="/" className="btn-primary inline-block min-w-[10rem] text-center">
          {t("errorPage.backHome")}
        </Link>
        <Link href="/products" className="btn-secondary inline-block min-w-[10rem] text-center">
          {t("errorPage.browseProducts")}
        </Link>
      </div>
    </div>
  );
}
