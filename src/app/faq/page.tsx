"use client";

import { useTranslations } from "@/lib/locale";

export default function FaqPage() {
  const t = useTranslations();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-white">{t("faq.title")}</h1>
      <dl className="mt-8 space-y-6">
        <div>
          <dt className="font-medium text-white">{t("faq.q1")}</dt>
          <dd className="mt-2 text-zinc-400">{t("faq.a1")}</dd>
        </div>
        <div>
          <dt className="font-medium text-white">{t("faq.q2")}</dt>
          <dd className="mt-2 text-zinc-400">{t("faq.a2")}</dd>
        </div>
        <div>
          <dt className="font-medium text-white">{t("faq.q3")}</dt>
          <dd className="mt-2 text-zinc-400">{t("faq.a3")}</dd>
        </div>
      </dl>
    </div>
  );
}
