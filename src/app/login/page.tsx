"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getProviders, signIn } from "next-auth/react";
import { useAuth } from "@/components/AuthContext";
import { useTranslations } from "@/lib/locale";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    getProviders().then((p) => setGoogleEnabled(!!p?.google));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      router.push(redirect);
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-2xl font-bold text-white">{t("login.title")}</h1>
      <p className="mt-2 text-zinc-400">{t("login.desc")}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div>
          <label className="block text-sm text-zinc-400">{t("login.email")}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
            placeholder="your@email.com"
          />
        </div>
        <div>
          <div className="flex items-center justify-between gap-2">
            <label className="block text-sm text-zinc-400">{t("login.password")}</label>
            <Link
              href={`/forgot-password?redirect=${encodeURIComponent(redirect)}`}
              className="text-sm text-brand-accent hover:underline"
            >
              {t("login.forgotPasswordLink")}
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
            placeholder="••••••••"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "..." : t("login.submit")}
        </button>
      </form>

      {googleEnabled ? (
        <>
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <span className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wide">
              <span className="bg-[#0a0a0c] px-3 text-zinc-500">{t("login.dividerOr")}</span>
            </div>
          </div>
          <button
            type="button"
            className="btn-secondary flex w-full items-center justify-center gap-2 border-zinc-600"
            onClick={() => signIn("google", { callbackUrl: redirect })}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t("login.continueWithGoogle")}
          </button>
        </>
      ) : null}

      <p className="mt-6 text-center text-sm text-zinc-500">
        {t("login.noAccount")}{" "}
        <Link
          href={`/register?redirect=${encodeURIComponent(redirect)}`}
          className="text-brand-accent hover:underline"
        >
          {t("login.register")}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16 text-zinc-400">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
