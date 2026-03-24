"use client";

import { useTranslations } from "@/lib/locale";

export function AboutContent() {
  const t = useTranslations();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-white">{t("about.title")}</h1>
      <p className="mt-6 text-zinc-400 leading-relaxed">{t("about.content")}</p>
    </div>
  );
}
