"use client";

import { useAuth } from "@/components/AuthContext";
import { useTranslations } from "@/lib/locale";

export default function AccountProfilePage() {
  const { user, logout } = useAuth();
  const t = useTranslations();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">{t("accountProfile.title")}</h1>
      <p className="mt-2 text-zinc-400">{t("accountProfile.desc")}</p>

      <div className="mt-8 max-w-md space-y-6 rounded-xl border border-zinc-800 bg-brand-card p-6">
        <div>
          <label className="block text-sm text-zinc-500">{t("accountProfile.name")}</label>
          <p className="mt-1 font-medium text-white">{user?.name ?? "—"}</p>
        </div>
        <div>
          <label className="block text-sm text-zinc-500">{t("accountProfile.email")}</label>
          <p className="mt-1 font-medium text-white">{user?.email ?? "—"}</p>
        </div>
        <p className="text-sm text-zinc-500">{t("accountProfile.desc")} (Demo.)</p>
        <button
          type="button"
          onClick={() => logout()}
          className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-2 text-sm text-red-400 transition hover:bg-red-950/50"
        >
          {t("accountProfile.logout")}
        </button>
      </div>
    </div>
  );
}
