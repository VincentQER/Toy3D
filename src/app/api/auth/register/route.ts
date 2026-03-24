import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import {
  isReasonableEmail,
  PASSWORD_MAX_LEN,
  PASSWORD_MIN_LEN,
  USER_NAME_MAX_LEN,
} from "@/lib/auth-input";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit-memory";

const REGISTER_WINDOW_MS = 15 * 60 * 1000;
const REGISTER_MAX_PER_IP = 15;

export async function POST(request: NextRequest) {
  try {
    const ip = getRequestIp(request);
    const limited = checkRateLimit(`register:${ip}`, REGISTER_MAX_PER_IP, REGISTER_WINDOW_MS);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many registration attempts. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSec) },
        },
      );
    }

    const body = await request.json();
    const email = String(body.email ?? "").toLowerCase().trim();
    const password = String(body.password ?? "");
    let name = String(body.name ?? "").trim();
    if (name.length > USER_NAME_MAX_LEN) {
      name = name.slice(0, USER_NAME_MAX_LEN);
    }

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    if (!isReasonableEmail(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (password.length < PASSWORD_MIN_LEN || password.length > PASSWORD_MAX_LEN) {
      return NextResponse.json(
        {
          error:
            password.length > PASSWORD_MAX_LEN
              ? "Password is too long"
              : "Password must be at least 6 characters",
        },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || email.split("@")[0],
        role: "buyer",
      },
    });

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
