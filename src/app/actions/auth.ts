"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { rawPrisma } from "@/server/db/client";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { createSession, destroyCurrentSession } from "@/server/auth/session";
import { recordAudit } from "@/server/services/audit";
import { brandedEmail, escapeHtml, sendMessage } from "@/server/services/messaging";
import {
  provisionSystemRoles,
  provisionDefaultExpenseCategories,
  provisionDefaultBranchStructure,
  provisionDefaultSettings,
} from "@/server/services/organization";
import { uniqueOrgSlug } from "@/lib/slug";
import { randomBytes } from "crypto";
import {
  consumeAuthRateLimit,
  hashSecurityToken,
  recordSecurityEvent,
  securityEmailBaseUrl,
  sendSecurityEmail,
} from "@/server/auth/security";
import { getTrialEndDate, planLimits, type Plan } from "@/lib/billing";
import {
  registerOrganizationSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";

export type ActionResult<T = undefined> =
  | { ok: true; data: T; warnings?: string[] }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

async function clientIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

/**
 * Creates a brand-new tenant: Organization, its seeded roles, a default
 * branch/warehouse/register, and the first user as Owner. Everything
 * happens in one DB transaction — a half-created organization (org row
 * with no owner, or roles with no organization) must never be possible.
 */
export async function registerOrganization(
  raw: unknown
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = registerOrganizationSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const input = parsed.data;

  const existingUser = await rawPrisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });
  if (existingUser) {
    return {
      ok: false,
      error: "An account with this email already exists. Try logging in.",
    };
  }

  const passwordHash = await hashPassword(input.password);
  const slug = await uniqueOrgSlug(
    input.businessName,
    async (candidate) =>
      (await rawPrisma.organization.findUnique({
        where: { slug: candidate },
      })) !== null
  );

  const result = await rawPrisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: input.businessName,
        slug,
        businessType: input.businessType,
        country: input.country,
        phone: input.phone || null,
        email: input.email.toLowerCase(),
      },
    });

    const roles = await provisionSystemRoles(tx, org.id);
    await provisionDefaultExpenseCategories(tx, org.id);
    await provisionDefaultBranchStructure(tx, org.id);
    await provisionDefaultSettings(tx, org.id);

    const user = await tx.user.create({
      data: {
        name: input.ownerName,
        email: input.email.toLowerCase(),
        passwordHash,
      },
    });

    await tx.userOrganization.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        roleId: roles.owner.id,
        isOwner: true,
      },
    });

    const trial = input.purchaseMode === "trial";
    await tx.subscription.create({
      data: {
        organizationId: org.id,
        plan: input.plan,
        status: trial ? "trialing" : "pending_payment",
        branchLimit: planLimits(input.plan as Plan).branchLimit,
        registerLimit: planLimits(input.plan as Plan).registerLimit,
        userLimit: planLimits(input.plan as Plan).userLimit,
        trialEndsAt: trial ? getTrialEndDate() : null,
      },
    });

    return { org, user };
  }, { maxWait: 10000, timeout: 30000 });

  await recordAudit({
    organizationId: result.org.id,
    userId: result.user.id,
    action: "ORGANIZATION_REGISTERED",
    entityType: "Organization",
    entityId: result.org.id,
  });

  await destroyCurrentSession();
  const h = await headers();
  await createSession({
    userId: result.user.id,
    organizationId: result.org.id,
    ipAddress: await clientIp(),
    userAgent: h.get("user-agent"),
  });

  const planName = input.plan.charAt(0).toUpperCase() + input.plan.slice(1);
  const trial = input.purchaseMode === "trial";
  const notificationFailures: string[] = [];

  try {
    await sendMessage({
      channel: "whatsapp",
      recipient: "254757308631",
      message: [
        "New DukaOS business registration",
        `Business: ${result.org.name}`,
        `Owner: ${result.user.name}`,
        `Email: ${result.user.email}`,
        `Phone: ${result.org.phone ?? "Not provided"}`,
        `Business type: ${result.org.businessType}`,
        `Package: ${planName}`,
        trial ? "Status: 7-day free trial" : "Status: Pending payment confirmation",
      ].join("\n"),
    });
  } catch (error) {
    notificationFailures.push("WhatsApp notification");
    console.error("[organization-registration] WhatsApp notification failed", error);
  }

  try {
    await sendMessage({
      channel: "email",
      recipient: result.user.email,
      subject: `Welcome to DukaOS, ${result.org.name}`,
      message: trial
        ? `Welcome to DukaOS, ${result.user.name}. Your ${result.org.name} workspace is ready with a 7-day free trial.\n\nLogin email: ${result.user.email}\nPackage: ${planName}\n\nSign in at ${process.env.NEXT_PUBLIC_APP_URL ?? "https://dukaos-organization.vercel.app"}/login to get started. Your password is the one you chose during registration.`
        : `Welcome to DukaOS, ${result.user.name}. Your ${result.org.name} workspace is ready and awaiting payment confirmation.\n\nLogin email: ${result.user.email}\nPackage: ${planName}\n\nPayment instructions will be shared before your workspace is activated. Your password is the one you chose during registration.`,
      html: brandedEmail({
        preheader: `Your ${result.org.name} workspace is ready.`,
        eyebrow: "Welcome to DukaOS",
        title: "Your business workspace is ready",
        body: trial
          ? `<p>Hi ${escapeHtml(result.user.name)},</p><p>Your <strong>${escapeHtml(result.org.name)}</strong> workspace has been created successfully. You have a 7-day free trial and can start using your dashboard immediately.</p><div style="margin:24px 0;padding:18px 20px;background:#f3faf7;border:1px solid #d9eae4;border-radius:8px"><p style="margin:0 0 10px;color:#102b4e;font-weight:bold">Your account</p><p style="margin:0;line-height:1.8">Email: <strong>${escapeHtml(result.user.email)}</strong><br>Package: <strong>${escapeHtml(planName)}</strong></p></div><p>Use the password you chose during registration. We never send passwords by email. Choose a paid plan before your trial ends to continue without interruption.</p>`
          : `<p>Hi ${escapeHtml(result.user.name)},</p><p>Your <strong>${escapeHtml(result.org.name)}</strong> workspace has been created and is awaiting payment confirmation.</p><div style="margin:24px 0;padding:18px 20px;background:#f3faf7;border:1px solid #d9eae4;border-radius:8px"><p style="margin:0 0 10px;color:#102b4e;font-weight:bold">Your account</p><p style="margin:0;line-height:1.8">Email: <strong>${escapeHtml(result.user.email)}</strong><br>Package: <strong>${escapeHtml(planName)}</strong></p></div><p>Use the password you chose during registration. We never send passwords by email. Payment instructions will be shared before your workspace is activated.</p>`,
        cta: { label: "Open DukaOS", url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://dukaos-organization.vercel.app"}/login` },
      }),
    });
  } catch (error) {
    notificationFailures.push("welcome email");
    console.error("[organization-registration] welcome email failed", error);
  }

  return {
    ok: true,
    data: { redirectTo: trial ? "/dashboard" : "/account-pending" },
    ...(notificationFailures.length > 0 ? { warnings: notificationFailures } : {}),
  };
}

export async function login(
  raw: unknown
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const { email, password } = parsed.data;
  const ipAddress = await clientIp();
  const ipAllowed = await consumeAuthRateLimit({
    scope: "business-login-ip",
    ipAddress,
    subject: email,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  const emailAllowed = await consumeAuthRateLimit({
    scope: "business-login-email",
    ipAddress: email.toLowerCase(),
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!ipAllowed || !emailAllowed) {
    return { ok: false, error: "Invalid email or password." };
  }

  const user = await rawPrisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      organizations: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  // Constant-shape response whether the email exists or not, to avoid
  // leaking which emails are registered.
  // Fixed, valid bcrypt hash with no matching plaintext — used only so a
  // login for a non-existent email takes the same time as a real one.
  const DUMMY_HASH =
    "$2b$12$AcmK/uvCLRGrWL2Yi.Zk9elAcl1xRvwN6Mmz2z4Gx8E3IglDvkzPa";
  const passwordOk = await verifyPassword(
    password,
    user ? user.passwordHash : DUMMY_HASH
  );

  if (!user || !passwordOk || !user.isActive) {
    await recordSecurityEvent({
      action: "USER_LOGIN_FAILED",
      targetUserId: user?.id ?? null,
      ipAddress,
    });
    return { ok: false, error: "Invalid email or password." };
  }

  const membership = user.organizations[0];
  if (!membership) {
    return {
      ok: false,
      error: "This account has no active business. Contact your administrator.",
    };
  }

  const subscription = await rawPrisma.subscription.findUnique({
    where: { organizationId: membership.organizationId },
    select: { status: true },
  });

  await destroyCurrentSession();
  const h = await headers();
  await createSession({
    userId: user.id,
    organizationId: membership.organizationId,
    ipAddress: await clientIp(),
    userAgent: h.get("user-agent"),
  });

  await recordAudit({
    organizationId: membership.organizationId,
    userId: user.id,
    action: "LOGIN",
    entityType: "User",
    entityId: user.id,
    ipAddress: await clientIp(),
  });
  await recordSecurityEvent({
    action: "USER_LOGIN_SUCCEEDED",
    actorAdminId: null,
    targetUserId: user.id,
    ipAddress,
  });

  return {
    ok: true,
    data: {
      redirectTo: subscription?.status === "pending_payment" || subscription?.status === "paused"
        ? "/account-pending"
        : "/dashboard",
    },
  };
}

const RESET_TOKEN_TTL_MS = 1000 * 60 * 30;

/**
 * Issues a password reset token. Returns `ok: true` unconditionally
 * whether or not the email exists, to avoid revealing which emails are
 * registered — the caller should always show a generic "check your
 * email" message.
 *
 */
export async function requestPasswordReset(
  raw: unknown
): Promise<ActionResult<undefined>> {
  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const email = parsed.data.email.toLowerCase();
  const ipAddress = await clientIp();
  const ipAllowed = await consumeAuthRateLimit({
    scope: "business-password-reset-ip",
    ipAddress,
    limit: 8,
    windowMs: 15 * 60 * 1000,
  });
  const emailAllowed = await consumeAuthRateLimit({
    scope: "business-password-reset-email",
    subject: email,
    limit: 3,
    windowMs: 30 * 60 * 1000,
  });
  if (!ipAllowed || !emailAllowed) return { ok: true, data: undefined };

  const user = await rawPrisma.user.findUnique({
    where: { email },
  });

  if (user?.isActive) {
    const token = randomBytes(32).toString("hex");
    const resetToken = await rawPrisma.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return tx.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashSecurityToken(token),
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });
    });
    await recordSecurityEvent({
      action: "USER_PASSWORD_RESET_REQUESTED",
      targetUserId: user.id,
      ipAddress,
    });

    try {
      const resetUrl = `${securityEmailBaseUrl()}/reset-password?token=${token}`;
      await sendSecurityEmail({
        recipient: user.email,
        subject: "Reset your DukaOS password",
        message: `Reset your password using this link: ${resetUrl}\n\nThis link expires in 30 minutes.`,
        html: brandedEmail({
          preheader: "Reset your DukaOS password.",
          eyebrow: "Account security",
          title: "Reset your password",
          body: "We received a request to reset your DukaOS password. Use the button below to choose a new password. This link expires in 30 minutes.",
          cta: { label: "Reset password", url: resetUrl },
        }),
      });
      await rawPrisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { deliveryStatus: "SENT" },
      });
    } catch (error) {
      await rawPrisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { deliveryStatus: "FAILED" },
      });
      await recordSecurityEvent({
        action: "USER_PASSWORD_RESET_EMAIL_FAILED",
        targetUserId: user.id,
        ipAddress,
      });
      console.error("[password-reset] email delivery failed", {
        userId: user.id,
        reason: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  return { ok: true, data: undefined };
}

export async function resetPassword(
  raw: unknown
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const tokenHash = hashSecurityToken(parsed.data.token);
  const ipAddress = await clientIp();
  const ipAllowed = await consumeAuthRateLimit({
    scope: "business-password-reset-submit-ip",
    ipAddress,
    limit: 12,
    windowMs: 15 * 60 * 1000,
  });
  const tokenAllowed = await consumeAuthRateLimit({
    scope: "business-password-reset-submit-token",
    ipAddress,
    subject: tokenHash,
    limit: 5,
    windowMs: 30 * 60 * 1000,
  });
  if (!ipAllowed || !tokenAllowed) {
    return {
      ok: false,
      error: "This reset link is invalid or has expired. Request a new one.",
    };
  }

  const resetToken = await rawPrisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, usedAt: true, revokedAt: true, deliveryStatus: true },
  });
  const now = new Date();
  if (
    !resetToken ||
    resetToken.usedAt ||
    resetToken.revokedAt ||
    resetToken.deliveryStatus !== "SENT" ||
    resetToken.expiresAt <= now
  ) {
    return {
      ok: false,
      error: "This reset link is invalid or has expired. Request a new one.",
    };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const reset = await rawPrisma.$transaction(async (tx) => {
    const claimed = await tx.passwordResetToken.updateMany({
      where: {
        id: resetToken.id,
        usedAt: null,
        revokedAt: null,
        deliveryStatus: "SENT",
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) return false;

    await tx.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });
    await tx.passwordResetToken.updateMany({
      where: { userId: resetToken.userId, usedAt: null, revokedAt: null },
      data: { revokedAt: now },
    });
    await tx.session.deleteMany({ where: { userId: resetToken.userId } });
    await tx.securityEvent.create({
      data: { action: "USER_PASSWORD_RESET", targetUserId: resetToken.userId },
    });
    return true;
  });

  if (!reset) {
    return {
      ok: false,
      error: "This reset link is invalid or has expired. Request a new one.",
    };
  }

  return { ok: true, data: { redirectTo: "/login" } };
}

export async function logout() {
  await destroyCurrentSession();
  redirect("/login");
}
