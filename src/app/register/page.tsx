"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { useTranslations } from "@/lib/locale";

function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await register(email, password, name);
    setLoading(false);
    if (ok) {
      router.push(redirect);
    } else {
      setError("Registration failed. Email may already be in use.");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-2xl font-bold text-white">{t("register.title")}</h1>
      <p className="mt-2 text-zinc-400">{t("register.desc")}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div>
          <label className="block text-sm text-zinc-400">{t("register.name")}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-400">{t("register.email")}</label>
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
          <label className="block text-sm text-zinc-400">{t("register.password")}</label>
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
          {loading ? "..." : t("register.submit")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        {t("register.haveAccount")}{" "}
        <Link
          href={`/login?redirect=${encodeURIComponent(redirect)}`}
          className="text-brand-accent hover:underline"
        >
          {t("register.login")}
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16 text-zinc-400">Loading…</div>}>
      <RegisterForm />
    </Suspense>
  );
}
