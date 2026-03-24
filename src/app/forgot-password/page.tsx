"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "@/lib/locale";

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const t = useTranslations();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      setLoading(false);
      setDone(true);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-2xl font-bold text-white">{t("forgotPassword.title")}</h1>
      <p className="mt-2 text-zinc-400">{t("forgotPassword.desc")}</p>

      {done ? (
        <p className="mt-8 rounded-lg border border-zinc-700 bg-brand-dark px-4 py-3 text-sm text-zinc-300">
          {t("forgotPassword.success")}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="forgot-password-email" className="block text-sm text-zinc-400">
              {t("forgotPassword.email")}
            </label>
            <input
              id="forgot-password-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
              placeholder="your@email.com"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "…" : t("forgotPassword.submit")}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-zinc-500">
        <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-brand-accent hover:underline">
          {t("forgotPassword.backToLogin")}
        </Link>
      </p>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16 text-zinc-400">Loading…</div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
