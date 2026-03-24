"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartContext";
import { useAuth } from "./AuthContext";
import { useLocale, useTranslations, type Locale } from "@/lib/locale";

function AccountLink() {
  const { isLoggedIn } = useAuth();
  const t = useTranslations();
  if (isLoggedIn) {
    return (
      <Link
        href="/account"
        className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
      >
        {t("nav.myAccount")}
      </Link>
    );
  }
  return (
    <Link
      href="/login"
      className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
    >
      {t("nav.login")}
    </Link>
  );
}

function AdminLink() {
  const { isAdmin } = useAuth();
  const t = useTranslations();
  if (!isAdmin) return null;
  return (
    <Link
      href="/admin"
      className="rounded-lg px-3 py-2 text-sm font-medium text-amber-400 transition hover:bg-zinc-800 hover:text-amber-300"
    >
      {t("nav.admin")}
    </Link>
  );
}

export function Header() {
  const { totalItems } = useCart();
  const t = useTranslations();
  const { locale, setLocale } = useLocale();

  const cartLabel =
    totalItems > 0
      ? t("nav.cartWithItems").replace("{count}", String(totalItems > 99 ? "99+" : totalItems))
      : t("nav.cart");

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-brand-dark/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-xl font-bold tracking-tight text-white"
          aria-label={t("nav.brandHome")}
        >
          Print<span className="text-brand-accent">Fig</span>
        </Link>

        <nav className="hidden gap-8 md:flex" aria-label={t("nav.mainNav")}>
          <Link
            href="/products"
            className="text-sm font-medium text-zinc-300 transition hover:text-white"
          >
            {t("nav.products")}
          </Link>
          <Link
            href="/products?category=preorder"
            className="text-sm font-medium text-zinc-300 transition hover:text-white"
          >
            {t("nav.preorder")}
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-zinc-300 transition hover:text-white"
          >
            {t("nav.about")}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher locale={locale} setLocale={setLocale} />
          <AdminLink />
          <AccountLink />
          <Link
            href="/cart"
            className="relative rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            aria-label={cartLabel}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {totalItems > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-accent text-xs font-medium text-white"
                aria-hidden
              >
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

function LanguageSwitcher({
  locale,
  setLocale,
}: {
  locale: Locale;
  setLocale: (l: Locale) => void;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = "header-language-listbox";

  const options: { value: Locale; label: string }[] = [
    { value: "en", label: "English" },
    { value: "zh", label: "中文" },
    { value: "es", label: "Español" },
  ];
  const current = options.find((o) => o.value === locale)?.label ?? "English";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  const handleSelect = (value: Locale) => {
    setLocale(value);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-900/70 px-2 py-1 text-xs text-zinc-200 hover:border-zinc-500"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={t("nav.chooseLanguage")}
      >
        <span className="mr-1 hidden sm:inline">Lang</span>
        <span aria-hidden>{current}</span>
        <span className="ml-1 text-zinc-500" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("nav.chooseLanguage")}
          className="absolute right-0 z-50 mt-1 w-36 rounded-lg border border-zinc-700 bg-zinc-900 py-1 text-xs text-zinc-100 shadow-lg"
        >
          {options.map((opt) => (
            <li key={opt.value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={locale === opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`flex w-full items-center px-3 py-1.5 text-left hover:bg-zinc-800 ${
                  locale === opt.value ? "text-brand-accent" : ""
                }`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
