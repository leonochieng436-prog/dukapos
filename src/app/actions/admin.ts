"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { rawPrisma } from "@/server/db/client";
import { verifyPassword } from "@/server/auth/password";
import { createAdminSession, destroyAdminSession, requireAdmin } from "@/server/auth/admin-session";
import { getCurrentSession } from "@/server/auth/session";
import { PLAN_CATALOG, type Plan } from "@/lib/billing";
import {
  consumeAuthRateLimit,
  recordSecurityEvent,
} from "@/server/auth/security";
import { z } from "zod";

export async function submitPaymentReference(formData: FormData): Promise<void> {
  const session = await getCurrentSession();
  const organizationId = String(formData.get("organizationId") || "");
  const paymentReference = String(formData.get("paymentReference") || "").trim();
  if (!session?.organizationId || session.organizationId !== organizationId || !paymentReference) return;
  await rawPrisma.subscription.update({
    where: { organizationId: session.organizationId },
    data: { paymentReference, paymentSubmittedAt: new Date() },
  });
  revalidatePath("/account-pending");
  revalidatePath("/admin");
}

export async function adminLogin(raw: unknown) {
  const parsed = z.object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(1024),
  }).safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalid admin email or password." };
  const email = parsed.data.email.toLowerCase();
  const requestHeaders = await headers();
  const ipAddress = requestHeaders.get("x-real-ip")?.trim() ??
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null;
  const ipAllowed = await consumeAuthRateLimit({
    scope: "platform-admin-login-ip",
    ipAddress,
    subject: email,
    limit: 8,
    windowMs: 15 * 60 * 1000,
  });
  const emailAllowed = await consumeAuthRateLimit({
    scope: "platform-admin-login-email",
    subject: email,
    limit: 8,
    windowMs: 15 * 60 * 1000,
  });
  if (!ipAllowed || !emailAllowed) return { ok: false, error: "Invalid admin email or password." };

  const admin = await rawPrisma.platformAdmin.findUnique({ where: { email } });
  const dummyHash = "$2b$12$AcmK/uvCLRGrWL2Yi.Zk9elAcl1xRvwN6Mmz2z4Gx8E3IglDvkzPa";
  const passwordMatches = await verifyPassword(parsed.data.password, admin?.passwordHash ?? dummyHash);
  if (!admin || !admin.isActive || admin.mustResetPassword || !passwordMatches) {
    await recordSecurityEvent({
      action: "PLATFORM_ADMIN_LOGIN_FAILED",
      targetAdminId: admin?.id ?? null,
      ipAddress,
    });
    return { ok: false, error: "Invalid admin email or password." };
  }

  await rawPrisma.platformAdmin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });
  await recordSecurityEvent({
    action: "PLATFORM_ADMIN_LOGIN_SUCCEEDED",
    actorAdminId: admin.id,
    targetAdminId: admin.id,
    ipAddress,
  });
  await destroyAdminSession();
  await createAdminSession(admin.id, requestHeaders.get("x-forwarded-for"), requestHeaders.get("user-agent"));
  return { ok: true, data: { redirectTo: "/admin" } };
}

export async function adminLogout() {
  await destroyAdminSession();
  redirect("/admin/login");
}

export async function approveSubscription(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const subscriptionId = String(formData.get("subscriptionId") || "");
  if (!subscriptionId) return;
  const subscription = await rawPrisma.subscription.findUnique({ where: { id: subscriptionId }, select: { organizationId: true, status: true, paymentReference: true } });
  if (!subscription || subscription.status !== "pending_payment" || !subscription.paymentReference?.trim()) return;
  await rawPrisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: "active",
      approvedAt: new Date(),
      approvedByAdminId: admin.id,
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
    },
  });
  revalidatePath("/admin");
  revalidatePath("/account-pending");
  revalidatePath(`/admin/organizations/${subscription.organizationId}`);
}

export async function pauseOrganization(formData: FormData): Promise<void> {
  await requireAdmin();
  const organizationId = String(formData.get("organizationId") || "");
  if (!organizationId) return;
  await rawPrisma.subscription.update({
    where: { organizationId },
    data: { status: "paused" },
  });
  revalidatePath("/admin");
}

export async function resumeOrganization(formData: FormData): Promise<void> {
  await requireAdmin();
  const organizationId = String(formData.get("organizationId") || "");
  if (!organizationId) return;
  await rawPrisma.subscription.update({
    where: { organizationId },
    data: { status: "active" },
  });
  revalidatePath("/admin");
}

export async function deleteOrganization(formData: FormData): Promise<void> {
  await requireAdmin();
  const organizationId = String(formData.get("organizationId") || "");
  if (!organizationId) return;
  await rawPrisma.$transaction(async (tx) => {
    const memberships = await tx.userOrganization.findMany({
      where: { organizationId },
      select: { userId: true },
    });
    await tx.organization.delete({ where: { id: organizationId } });
    await tx.user.deleteMany({
      where: { id: { in: memberships.map((membership) => membership.userId) }, organizations: { none: {} } },
    });
  });
  revalidatePath("/admin");
}

export async function updateOrganizationLimits(formData: FormData): Promise<void> {
  await requireAdmin();
  const organizationId = String(formData.get("organizationId") || "");
  const plan = String(formData.get("plan") || "") as Plan;
  if (!organizationId || !PLAN_CATALOG[plan]) return;
  const catalog = PLAN_CATALOG[plan];
  const readLimit = (name: string, fallback: number) => {
    const value = Number(formData.get(name));
    return Number.isInteger(value) && value > 0 ? value : fallback;
  };
  await rawPrisma.subscription.update({ where: { organizationId }, data: {
    plan,
    branchLimit: readLimit("branchLimit", catalog.branchLimit),
    registerLimit: readLimit("registerLimit", catalog.registerLimit),
    userLimit: readLimit("userLimit", catalog.userLimit),
  } });
  revalidatePath("/admin");
}

export async function updateOrganizationUserStatus(formData: FormData): Promise<void> {
  await requireAdmin();
  const organizationId = String(formData.get("organizationId") || "");
  const userId = String(formData.get("userId") || "");
  const isActive = String(formData.get("isActive") || "") === "true";
  if (!organizationId || !userId) return;
  await rawPrisma.userOrganization.update({
    where: { userId_organizationId: { userId, organizationId } },
    data: { isActive },
  });
  revalidatePath(`/admin/organizations/${organizationId}`);
  revalidatePath("/admin");
}