/** 站点绝对 URL（SEO、sitemap、robots）。生产环境务必设置 NEXT_PUBLIC_SITE_URL，勿带末尾斜杠。 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:3000";
}

/** 密码重置等邮件内链接：优先 NEXTAUTH_URL，否则与 getSiteUrl() 一致。 */
export function getAuthSiteUrl(): string {
  const raw = process.env.NEXTAUTH_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return getSiteUrl();
}
