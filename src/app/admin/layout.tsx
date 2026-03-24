"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useTranslations } from "@/lib/locale";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const t = useTranslations();

  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "admin";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?redirect=/admin");
    }
  }, [status, router]);

  const nav = [
    { href: "/admin", label: t("admin.dashboard") },
    { href: "/admin/products", label: t("admin.products") },
    { href: "/admin/orders", label: t("admin.orders") },
  ];

  if (status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-zinc-400">{t("admin.sessionLoading")}</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-zinc-400">{t("account.loginRequired")}</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-white">{t("admin.accessDenied")}</h1>
        <p className="mt-4 text-zinc-400">{t("admin.accessDeniedDesc")}</p>
        <Link href="/" className="btn-primary mt-6 inline-block">
          {t("admin.backToStore")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-amber-400">{t("admin.title")}</h1>
        <Link href="/" className="text-sm text-zinc-400 hover:text-white">← {t("footer.shop")}</Link>
      </div>
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-48">
          <nav className="flex flex-wrap gap-2 lg:flex-col">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  pathname === item.href
                    ? "bg-amber-500/20 text-amber-400"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
