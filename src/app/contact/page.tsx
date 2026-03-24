"use client";

import { useTranslations } from "@/lib/locale";

export default function ContactPage() {
  const t = useTranslations();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-white">{t("contact.title")}</h1>
      <p className="mt-6 text-zinc-400">{t("contact.email")}</p>
      <p className="mt-2 text-zinc-400">{t("contact.hours")}</p>
      <p className="mt-6 text-zinc-400">{t("contact.coop")}</p>
    </div>
  );
}
