/**
 * 根据承运商关键字生成追踪页 URL（买家「我的订单」与邮件模板可共用）
 */
export function buildCarrierTrackingUrl(
  carrier: string | null | undefined,
  trackingNumber: string,
): string {
  const n = trackingNumber.trim();
  if (!n) return "#";
  const encoded = encodeURIComponent(n);
  const c = (carrier ?? "").trim().toLowerCase();

  if (c.includes("ups")) return `https://www.ups.com/track?tracknum=${encoded}`;
  if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${encoded}`;
  if (c.includes("usps")) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encoded}`;
  // Public Express tracking (tracking-id works for most airwaybill-style numbers)
  if (c.includes("dhl")) {
    return `https://www.dhl.com/global-en/home/tracking/tracking-express.html?tracking-id=${encoded}`;
  }

  return `https://www.google.com/search?q=${encodeURIComponent(`${carrier ?? "package"} tracking ${n}`)}`;
}
