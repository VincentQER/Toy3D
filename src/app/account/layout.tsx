"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { useTranslations } from "@/lib/locale";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const t = useTranslations();

  const nav = [
    { href: "/account", label: t("account.overview") },
    { href: "/account/orders", label: t("account.orders") },
    { href: "/account/addresses", label: t("account.addresses") },
    { href: "/account/profile", label: t("account.profile") },
  ];

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-zinc-400">{t("account.loginRequired")}</p>
        <Link href="/login" className="btn-primary mt-4 inline-block">
          {t("account.goLogin")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-56">
          <nav className="flex flex-wrap gap-2 lg:flex-col lg:gap-0">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition lg:rounded-l-lg lg:rounded-r-none ${
                  pathname === item.href
                    ? "bg-brand-accent text-white"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
