import "server-only";

import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * 管理员 API 鉴权：必须已登录，且数据库中 role 为 admin（不单独信任 JWT 里的 role，避免降级后仍可操作）。
 */
export async function requireAdminSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { role: true },
  });
  if (user?.role !== "admin") return null;

  return session;
}
