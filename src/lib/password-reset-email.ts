import "server-only";
import { Resend } from "resend";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendPasswordResetEmail(
  to: string,
  payload: { name: string; resetUrl: string },
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[password-reset-email] RESEND_API_KEY not set; reset link not emailed");
    return { sent: false };
  }

  const from =
    process.env.RESEND_FROM?.trim() ?? "PrintFig <onboarding@resend.dev>";
  const resend = new Resend(apiKey);
  const url = payload.resetUrl;

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;background:#0f0f12;color:#e4e4e7;font-family:system-ui,-apple-system,sans-serif;line-height:1.5;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="color:#818cf8;font-weight:700;font-size:18px;margin:0 0 8px;">PrintFig</p>
    <h1 style="font-size:22px;margin:0 0 16px;color:#fafafa;">Reset your password</h1>
    <p style="margin:0 0 8px;color:#a1a1aa;">Hi ${escapeHtml(payload.name)},</p>
    <p style="margin:0 0 20px;color:#d4d4d8;">We received a request to reset your PrintFig account password. Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.</p>
    <a href="${escapeHtml(url)}" style="display:inline-block;background:#818cf8;color:#0f0f12;font-weight:600;padding:14px 24px;border-radius:10px;text-decoration:none;font-size:15px;margin:0 0 24px;">Reset password</a>
    <p style="margin:0;font-size:12px;color:#52525b;">If you didn’t ask for this, you can ignore this email. Your password will stay the same.</p>
  </div>
</body>
</html>`;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject: "Reset your PrintFig password",
      html,
    });
    if (error) {
      console.error("[password-reset-email] Resend error:", error);
      return { sent: false, error: JSON.stringify(error) };
    }
    if (!data?.id) return { sent: false, error: "No message id" };
    return { sent: true };
  } catch (e) {
    console.error("[password-reset-email] send failed:", e);
    return { sent: false, error: String(e) };
  }
}
