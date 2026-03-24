"use client";

import Link from "next/link";
import { useTranslations } from "@/lib/locale";

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="mt-auto border-t border-zinc-800 bg-brand-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <p className="font-display text-lg font-bold text-white">
              Print<span className="text-brand-accent">Fig</span>
            </p>
            <p className="mt-2 text-sm text-zinc-400">{t("footer.tagline")}</p>
          </div>
          <nav aria-labelledby="footer-nav-shop-title">
            <h2 id="footer-nav-shop-title" className="font-medium text-white">
              {t("footer.shop")}
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              <li>
                <Link href="/products" className="transition hover:text-white">
                  {t("footer.allProducts")}
                </Link>
              </li>
              <li>
                <Link href="/products?category=preorder" className="transition hover:text-white">
                  {t("footer.preorder")}
                </Link>
              </li>
              <li>
                <Link href="/cart" className="transition hover:text-white">
                  {t("footer.cart")}
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-labelledby="footer-nav-help-title">
            <h2 id="footer-nav-help-title" className="font-medium text-white">
              {t("footer.help")}
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              <li>
                <Link href="/shipping" className="transition hover:text-white">
                  {t("footer.shipping")}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="transition hover:text-white">
                  {t("footer.faq")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition hover:text-white">
                  {t("footer.contact")}
                </Link>
              </li>
            </ul>
          </nav>
          <div>
            <h2 className="font-medium text-white">{t("footer.follow")}</h2>
            <p className="mt-3 text-sm text-zinc-400">—</p>
          </div>
        </div>
        <div className="mt-10 border-t border-zinc-800 pt-8 text-center text-sm text-zinc-500">
          © {new Date().getFullYear()} {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
}
