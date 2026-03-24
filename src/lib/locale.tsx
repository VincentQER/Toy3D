"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { getTranslation } from "./translations";

export type Locale = "en" | "zh" | "es";

const STORAGE_KEY = "printfig-locale";

/** 根据浏览器语言推断界面语言（仅首次无保存偏好时使用） */
function detectBrowserLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const list =
    typeof navigator.languages !== "undefined" && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language || "en"];
  for (const raw of list) {
    const tag = String(raw).trim().toLowerCase();
    if (tag.startsWith("zh")) return "zh";
    if (tag.startsWith("es")) return "es";
  }
  return "en";
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as string | null;
      if (stored === "en" || stored === "zh" || stored === "es") {
        setLocaleState(stored);
        return;
      }
      // 从未手动选过语言：按浏览器语言自动选（中 / 西 / 其余为英文）
      setLocaleState(detectBrowserLocale());
    } catch {
      setLocaleState(detectBrowserLocale());
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const lang =
      locale === "zh" ? "zh-CN" : locale === "es" ? "es" : "en";
    document.documentElement.lang = lang;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

/** Returns t(key) for current locale. Use in client components. */
export function useTranslations() {
  const { locale } = useLocale();
  return useCallback((key: string) => getTranslation(locale, key), [locale]);
}
