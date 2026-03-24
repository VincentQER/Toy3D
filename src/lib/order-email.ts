import "server-only";
import { Resend } from "resend";
import { buildCarrierTrackingUrl } from "@/lib/shipping-tracking";

export type OrderLineForEmail = {
  productId: string;
  quantity: number;
  priceAtPurchase: number;
};

export type OrderForEmail = {
  id: string;
  total: number;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  items: OrderLineForEmail[];
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * 发送订单确认邮件。未配置 RESEND_API_KEY 时静默跳过（下单仍成功）。
 */
export async function sendOrderConfirmationEmail(
  to: string,
  order: OrderForEmail,
  productNames: Map<string, string>,
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false };
  }

  const from =
    process.env.RESEND_FROM?.trim() ?? "PrintFig <onboarding@resend.dev>";
  const resend = new Resend(apiKey);
  const ref = order.id.slice(0, 8);

  const rows = order.items
    .map((line) => {
      const name = productNames.get(line.productId) ?? "Product";
      const lineTotal = line.priceAtPurchase * line.quantity;
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #27272a;">${escapeHtml(name)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #27272a;text-align:center;">${line.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #27272a;text-align:right;">$${line.priceAtPurchase.toFixed(2)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #27272a;text-align:right;">$${lineTotal.toFixed(2)}</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;background:#0f0f12;color:#e4e4e7;font-family:system-ui,-apple-system,sans-serif;line-height:1.5;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="color:#818cf8;font-weight:700;font-size:18px;margin:0 0 8px;">PrintFig</p>
    <h1 style="font-size:22px;margin:0 0 16px;color:#fafafa;">Thank you for your order</h1>
    <p style="margin:0 0 8px;color:#a1a1aa;">Hi ${escapeHtml(order.shippingName)},</p>
    <p style="margin:0 0 20px;color:#d4d4d8;">We've received your order <strong style="color:#fff;">#${ref}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
      <thead>
        <tr style="text-align:left;color:#71717a;font-size:12px;text-transform:uppercase;">
          <th style="padding:8px 0;border-bottom:1px solid #3f3f46;">Item</th>
          <th style="padding:8px 0;border-bottom:1px solid #3f3f46;text-align:center;">Qty</th>
          <th style="padding:8px 0;border-bottom:1px solid #3f3f46;text-align:right;">Each</th>
          <th style="padding:8px 0;border-bottom:1px solid #3f3f46;text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-size:18px;font-weight:600;color:#fff;margin:0 0 24px;">Order total: $${order.total.toFixed(2)}</p>
    <div style="background:#18181c;border-radius:12px;padding:16px;border:1px solid #27272a;">
      <p style="margin:0 0 4px;color:#71717a;font-size:12px;">Shipping address</p>
      <p style="margin:0;color:#d4d4d8;font-size:14px;">${escapeHtml(order.shippingAddress)}</p>
      <p style="margin:12px 0 0;color:#d4d4d8;font-size:14px;">${escapeHtml(order.shippingPhone)}</p>
    </div>
    <p style="margin:24px 0 0;font-size:12px;color:#52525b;">US domestic shipping. Questions? Reply to this email or contact service@printfig.com</p>
  </div>
</body>
</html>`;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject: `Your PrintFig order #${ref} is confirmed`,
      html,
    });
    if (error) {
      console.error("[order-email] Resend error:", error);
      return { sent: false, error: JSON.stringify(error) };
    }
    if (!data?.id) {
      return { sent: false, error: "No message id" };
    }
    return { sent: true };
  } catch (e) {
    console.error("[order-email] send failed:", e);
    return { sent: false, error: String(e) };
  }
}

export type OrderShippedEmailPayload = {
  orderId: string;
  shippingName: string;
  trackingNumber: string | null;
  carrier: string | null;
};

/**
 * 订单标记为已发货时通知买家。未配置 RESEND_API_KEY 时静默跳过。
 */
export async function sendOrderShippedEmail(
  to: string,
  payload: OrderShippedEmailPayload,
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false };
  }

  const from =
    process.env.RESEND_FROM?.trim() ?? "PrintFig <onboarding@resend.dev>";
  const resend = new Resend(apiKey);
  const ref = payload.orderId.slice(0, 8);
  const hasTracking =
    typeof payload.trackingNumber === "string" && payload.trackingNumber.trim().length > 0;
  const trackUrl = hasTracking
    ? buildCarrierTrackingUrl(payload.carrier, payload.trackingNumber!.trim())
    : null;

  const trackingBlock = hasTracking
    ? `<div style="background:#18181c;border-radius:12px;padding:16px;border:1px solid #27272a;margin:0 0 20px;">
      <p style="margin:0 0 8px;color:#71717a;font-size:12px;text-transform:uppercase;">Tracking</p>
      <p style="margin:0 0 4px;color:#fafafa;font-size:16px;font-family:ui-monospace,monospace;">${escapeHtml(payload.trackingNumber!.trim())}</p>
      ${payload.carrier?.trim() ? `<p style="margin:0 0 16px;color:#a1a1aa;font-size:14px;">${escapeHtml(payload.carrier.trim())}</p>` : ""}
      <a href="${escapeHtml(trackUrl!)}" style="display:inline-block;background:#818cf8;color:#0f0f12;font-weight:600;padding:12px 20px;border-radius:10px;text-decoration:none;font-size:14px;">Track shipment</a>
    </div>`
    : `<p style="margin:0 0 20px;color:#a1a1aa;font-size:14px;">Tracking details will appear in your account when available.</p>`;

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;background:#0f0f12;color:#e4e4e7;font-family:system-ui,-apple-system,sans-serif;line-height:1.5;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="color:#818cf8;font-weight:700;font-size:18px;margin:0 0 8px;">PrintFig</p>
    <h1 style="font-size:22px;margin:0 0 16px;color:#fafafa;">Your order has shipped</h1>
    <p style="margin:0 0 8px;color:#a1a1aa;">Hi ${escapeHtml(payload.shippingName)},</p>
    <p style="margin:0 0 20px;color:#d4d4d8;">Order <strong style="color:#fff;">#${ref}</strong> is on its way. Thank you for shopping with us!</p>
    ${trackingBlock}
    <p style="margin:0;font-size:12px;color:#52525b;">View all orders in your PrintFig account. Questions? Reply to this email.</p>
  </div>
</body>
</html>`;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject: `Your PrintFig order #${ref} has shipped`,
      html,
    });
    if (error) {
      console.error("[order-email shipped] Resend error:", error);
      return { sent: false, error: JSON.stringify(error) };
    }
    if (!data?.id) {
      return { sent: false, error: "No message id" };
    }
    return { sent: true };
  } catch (e) {
    console.error("[order-email shipped] send failed:", e);
    return { sent: false, error: String(e) };
  }
}
