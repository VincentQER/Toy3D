import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSiteUrl } from "@/lib/site-url";
import { sendPasswordResetEmail } from "@/lib/password-reset-email";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit-memory";
import { isReasonableEmail } from "@/lib/auth-input";

/** 统一成功文案，避免枚举注册邮箱 */
const OK_BODY = { ok: true as const };

const FORGOT_WINDOW_MS = 15 * 60 * 1000;
const FORGOT_MAX_PER_IP = 10;

export async function POST(request: NextRequest) {
  try {
    const ip = getRequestIp(request);
    const limited = checkRateLimit(`forgot-pw:${ip}`, FORGOT_MAX_PER_IP, FORGOT_WINDOW_MS);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSec) },
        },
      );
    }

    const body = await request.json();
    const email = String(body.email ?? "")
      .toLowerCase()
      .trim();

    if (!email || !isReasonableEmail(email)) {
      return NextResponse.json(OK_BODY);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(OK_BODY);
    }

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const resetUrl = `${getAuthSiteUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    await sendPasswordResetEmail(user.email, {
      name: user.name ?? user.email.split("@")[0],
      resetUrl,
    });

    return NextResponse.json(OK_BODY);
  } catch (e) {
    console.error("[forgot-password]", e);
    return NextResponse.json(OK_BODY);
  }
}
