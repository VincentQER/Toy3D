import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit-memory";
import { PASSWORD_MAX_LEN, PASSWORD_MIN_LEN } from "@/lib/auth-input";

const TOKEN_MAX = 128;
const RESET_WINDOW_MS = 15 * 60 * 1000;
const RESET_MAX_PER_IP = 30;

export async function POST(request: NextRequest) {
  try {
    const ip = getRequestIp(request);
    const limited = checkRateLimit(`reset-pw:${ip}`, RESET_MAX_PER_IP, RESET_WINDOW_MS);
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
    const token = String(body.token ?? "").trim();
    const password = String(body.password ?? "");

    if (!token || token.length > TOKEN_MAX) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Request a new one." },
        { status: 400 },
      );
    }
    if (password.length < PASSWORD_MIN_LEN || password.length > PASSWORD_MAX_LEN) {
      return NextResponse.json(
        {
          error:
            password.length > PASSWORD_MAX_LEN
              ? "Password is too long."
              : "Password must be at least 6 characters.",
        },
        { status: 400 },
      );
    }

    const row = await prisma.passwordResetToken.findUnique({
      where: { token },
    });
    if (!row || row.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Request a new one." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.deleteMany({ where: { userId: row.userId } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
