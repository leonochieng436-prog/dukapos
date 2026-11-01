import "server-only";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { rawPrisma } from "@/server/db/client";

const ADMIN_SESSION_COOKIE = "pos_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAdminSession(adminId: string, ipAddress?: string | null, userAgent?: string | null) {
  const token = randomBytes(32).toString("hex");
  await rawPrisma.adminSession.create({
    data: {
      adminId,
      tokenHash: hashToken(token),
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + SESSION_TTL_MS),
  });
}

export async function getCurrentAdmin() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await rawPrisma.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { admin: true },
  });
  if (
    !session ||
    session.expiresAt < new Date() ||
    !session.admin.isActive ||
    session.admin.mustResetPassword
  ) return null;
  return session.admin;
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (token) await rawPrisma.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  cookieStore.set(ADMIN_SESSION_COOKIE, "", { httpOnly: true, path: "/", expires: new Date(0), maxAge: 0 });
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("ADMIN_AUTH_REQUIRED");
  return admin;
}

export async function requireSuperAdmin() {
  const admin = await requireAdmin();
  if (admin.role !== "SUPER_ADMIN") throw new Error("SUPER_ADMIN_REQUIRED");
  return admin;
}