"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "@/lib/locale";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();

  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16">
      <div
        className="rounded-full bg-red-500/10 p-4 text-red-400"
        aria-hidden
      >
        <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <h1 className="mt-6 font-display text-2xl font-semibold text-white sm:text-3xl">
        {t("errorPage.serverTitle")}
      </h1>
      <p className="mt-3 max-w-md text-center text-sm leading-relaxed text-zinc-400">
        {t("errorPage.serverDesc")}
      </p>
      {process.env.NODE_ENV === "development" && error.message ? (
        <pre className="mt-6 max-h-32 max-w-lg overflow-auto rounded-lg border border-zinc-800 bg-zinc-900/80 p-3 text-left text-xs text-red-300/90">
          {error.message}
        </pre>
      ) : null}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={reset} className="btn-primary min-w-[10rem]">
          {t("errorPage.tryAgain")}
        </button>
        <Link href="/" className="btn-secondary min-w-[10rem] text-center">
          {t("errorPage.backHome")}
        </Link>
      </div>
    </div>
  );
}
