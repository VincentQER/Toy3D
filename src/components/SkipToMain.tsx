"use client";

import { useTranslations } from "@/lib/locale";

/** 键盘用户优先：跳到 #main-content */
export function SkipToMain() {
  const t = useTranslations();
  return (
    <a href="#main-content" className="skip-to-main">
      {t("a11y.skipToContent")}
    </a>
  );
}
