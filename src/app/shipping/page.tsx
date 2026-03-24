"use client";

import { useTranslations } from "@/lib/locale";

export default function ShippingPage() {
  const t = useTranslations();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-white">{t("shipping.title")}</h1>
      <div className="mt-8 space-y-6 text-zinc-400">
        <section>
          <h2 className="font-semibold text-white">{t("shipping.methods")}</h2>
          <p className="mt-2">{t("shipping.methodsDesc")}</p>
        </section>
        <section>
          <h2 className="font-semibold text-white">{t("shipping.cost")}</h2>
          <p className="mt-2">{t("shipping.costDesc")}</p>
        </section>
        <section>
          <h2 className="font-semibold text-white">{t("shipping.combine")}</h2>
          <p className="mt-2">{t("shipping.combineDesc")}</p>
        </section>
      </div>
    </div>
  );
}
