"use client";

import Link from "next/link";
import type { Category } from "@/lib/types";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { useTranslations } from "@/lib/locale";

interface HomeContentProps {
  categories: Category[];
  featured: Product[];
}

export function HomeContent({ categories, featured }: HomeContentProps) {
  const t = useTranslations();

  return (
    <div>
      <section className="relative overflow-hidden border-b border-zinc-800 bg-gradient-to-b from-brand-card to-brand-dark">
        <HeroBackdrop />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {t("home.heroTitle")}
              <span className="block text-brand-accent">{t("home.heroSubtitle")}</span>
            </h1>
            <p className="mt-4 text-lg text-zinc-400">{t("home.heroDesc")}</p>
            <div className="mt-8 flex gap-4">
              <Link href="/products" className="btn-primary">
                {t("home.browseProducts")}
              </Link>
              <Link href="/products?category=action-figure" className="btn-secondary">
                {t("home.actionFigure")}
              </Link>
              <Link href="/products?category=preorder" className="btn-secondary">
                {t("home.preorder")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-800 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-display text-2xl font-bold text-white">{t("home.categories")}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.id}`}
                className="group rounded-xl border border-zinc-800 bg-brand-card p-6 transition hover:border-brand-accent/50 hover:bg-brand-card/80"
              >
                <span className="font-medium text-white group-hover:text-brand-accent">
                  {t(`categories.${cat.id}.name`)}
                </span>
                <p className="mt-1 text-sm text-zinc-500">{t(`categories.${cat.id}.description`)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold text-white">{t("home.featured")}</h2>
            <Link href="/products" className="text-sm font-medium text-brand-accent transition hover:underline">
              {t("home.viewAll")} →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-800 bg-brand-card/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-display text-2xl font-bold text-white">{t("home.whyUs")}</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-accent/20 text-brand-accent">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="mt-4 font-semibold text-white">{t("home.whyOriginal")}</h3>
              <p className="mt-2 text-sm text-zinc-400">{t("home.whyOriginalDesc")}</p>
            </div>
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-filament-cyan/20 text-filament-cyan">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.172-.426a1 1 0 00-.995.91l-.112 2.59a2 2 0 01-1.432 1.84L6.834 18.16a2 2 0 01-1.732-.346l-2.45-1.653a2 2 0 00-2.416.063l-.5.5" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 font-semibold text-white">{t("home.whyPreorder")}</h3>
              <p className="mt-2 text-sm text-zinc-400">{t("home.whyPreorderDesc")}</p>
            </div>
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-filament-magenta/20 text-filament-magenta">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4a4 4 0 01-8 0" />
                </svg>
              </div>
              <h3 className="mt-4 font-semibold text-white">{t("home.whyShip")}</h3>
              <p className="mt-2 text-sm text-zinc-400">{t("home.whyShipDesc")}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
