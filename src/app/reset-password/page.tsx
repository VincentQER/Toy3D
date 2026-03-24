"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "@/lib/locale";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const missingToken = !token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (missingToken) {
      setError(t("resetPassword.invalidToken"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("resetPassword.invalidToken"));
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError(t("resetPassword.invalidToken"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-2xl font-bold text-white">{t("resetPassword.title")}</h1>
      <p className="mt-2 text-zinc-400">{t("resetPassword.desc")}</p>

      {success ? (
        <p className="mt-8 rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">
          {t("resetPassword.success")}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {(missingToken || error) && (
            <p className="text-sm text-red-400">{missingToken ? t("resetPassword.invalidToken") : error}</p>
          )}
          <div>
            <label className="block text-sm text-zinc-400">{t("resetPassword.newPassword")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={missingToken}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading || missingToken} className="btn-primary w-full">
            {loading ? "…" : t("resetPassword.submit")}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-zinc-500">
        <Link href="/login" className="text-brand-accent hover:underline">
          {t("resetPassword.backToLogin")}
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16 text-zinc-400">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
