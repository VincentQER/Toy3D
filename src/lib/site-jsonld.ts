import "server-only";

import { getSiteUrl } from "@/lib/site-url";

function absAssetUrl(siteBase: string, pathOrUrl: string): string {
  const u = pathOrUrl.trim();
  if (!u) return siteBase;
  if (/^https?:\/\//i.test(u)) return u;
  return `${siteBase}${u.startsWith("/") ? u : `/${u}`}`;
}

function parseSameAsUrls(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s));
}

/**
 * 首页 JSON-LD：`Organization` + `WebSite`（含站内搜索 `SearchAction` → `/products?q=`）
 * 可选：`NEXT_PUBLIC_ORGANIZATION_LOGO`、`NEXT_PUBLIC_ORGANIZATION_SAME_AS`（逗号/分号分隔的 https 链接）
 */
export function buildHomePageJsonLd(): Record<string, unknown> {
  const base = getSiteUrl();
  const organizationId = `${base}/#organization`;
  const websiteId = `${base}/#website`;

  const logoRaw = process.env.NEXT_PUBLIC_ORGANIZATION_LOGO?.trim();
  const logo = logoRaw ? absAssetUrl(base, logoRaw) : undefined;
  const sameAs = parseSameAsUrls(process.env.NEXT_PUBLIC_ORGANIZATION_SAME_AS);

  const organization: Record<string, unknown> = {
    "@type": "Organization",
    "@id": organizationId,
    name: "PrintFig",
    url: base,
    description:
      "3D printed action figures and collectibles — Marvel, DC, Sonic and more. US-focused e-commerce.",
  };
  if (logo) organization.logo = logo;
  if (sameAs.length) organization.sameAs = sameAs;

  return {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: "PrintFig",
        url: base,
        description:
          "High-quality 3D printed action figures and statues. Pre-order and in-stock collectibles, US shipping.",
        publisher: { "@id": organizationId },
        inLanguage: ["en-US", "zh-CN", "es"],
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${base}/products?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}
