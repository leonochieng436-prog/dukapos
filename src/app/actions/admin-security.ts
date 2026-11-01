"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { rawPrisma } from "@/server/db/client";
import { requireSuperAdmin } from "@/server/auth/admin-session";
import { hashPassword } from "@/server/auth/password";
import {
  consumeAuthRateLimit,
  createSecurityToken,
  hashSecurityToken,
  recordSecurityEvent,
  securityEmailBaseUrl,
  sendSecurityEmail,
} from "@/server/auth/security";
import { brandedEmail, escapeHtml } from "@/server/services/messaging";

const TOKEN_TTL_MS = 30 * 60 * 1000;
const platformAdminRoleSchema = z.enum(["ADMIN", "SUPER_ADMIN"]);
const invitationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  role: platformAdminRoleSchema,
});
const tokenPasswordSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/i),
  password: z.string().min(15).max(1024),
});

export type AdminSecurityActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

function requestIp(headersList: Headers): string | null {
  return headersList.get("x-real-ip")?.trim() ??
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null;
}

function failure(message: string): AdminSecurityActionResult {
  return { ok: false, message };
}

async function deliverAdminInvitation(input: {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SUPER_ADMIN";
  token: string;
}): Promise<boolean> {
  try {
    const url = `${securityEmailBaseUrl()}/admin/accept-invitation?token=${input.token}`;
    await sendSecurityEmail({
      recipient: input.email,
      subject: "Your DukaOS administrator invitation",
      message: `Hello ${input.name}, accept your DukaOS administrator invitation using this link: ${url}\n\nThe link expires in 30 minutes. If you did not expect this invitation, you can ignore this email.`,
      html: brandedEmail({
        preheader: "You have been invited to administer DukaOS.",
        eyebrow: "Administrator invitation",
        title: "Set up your administrator account",
        body: `<p>Hello ${escapeHtml(input.name)},</p><p>You have been invited as a <strong>${input.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}</strong>. Use the secure link below to set your own password. It expires in 30 minutes.</p><p>If you did not expect this invitation, you can ignore this email.</p>`,
        cta: { label: "Accept invitation", url },
      }),
    });
  } catch (error) {
    await rawPrisma.platformAdminInvitation.update({
      where: { id: input.id },
      data: { deliveryStatus: "FAILED" },
    });
    console.error("[platform-admin] invitation email failed", {
      invitationId: input.id,
      reason: error instanceof Error ? error.message : "unknown",
    });
    return false;
  }

  await rawPrisma.platformAdminInvitation.update({
    where: { id: input.id },
    data: { deliveryStatus: "SENT" },
  });
  return true;
}

export async function invitePlatformAdmin(raw: unknown): Promise<AdminSecurityActionResult> {
  const actor = await requireSuperAdmin();
  const parsed = invitationSchema.safeParse(raw);
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Enter valid invitation details.");

  const requestHeaders = await headers();
  const ipAddress = requestIp(requestHeaders);
  const actorLimit = await consumeAuthRateLimit({
    scope: "platform-admin-invitation-actor",
    subject: actor.id,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!actorLimit || !(await consumeAuthRateLimit({
    scope: "platform-admin-invitation",
    ipAddress,
    subject: actor.id,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  }))) {
    return failure("Invitation limit reached. Try again later.");
  }

  const email = parsed.data.email.toLowerCase();
  const [admin, businessUser] = await Promise.all([
    rawPrisma.platformAdmin.findUnique({ where: { email }, select: { id: true } }),
    rawPrisma.user.findUnique({ where: { email }, select: { id: true } }),
  ]);
  if (admin || businessUser) return failure("That email already belongs to an account.");

  const token = createSecurityToken();
  const invitation = await rawPrisma.$transaction(async (tx) => {
    await tx.platformAdminInvitation.updateMany({
      where: { email, usedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    const created = await tx.platformAdminInvitation.create({
      data: {
        name: parsed.data.name,
        email,
        role: parsed.data.role,
        tokenHash: hashSecurityToken(token),
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });
    await tx.securityEvent.create({
      data: {
        action: "PLATFORM_ADMIN_INVITED",
        actorAdminId: actor.id,
        ipAddress,
        metadata: { targetEmail: email, role: parsed.data.role },
      },
    });
    return created;
  }, { isolationLevel: "Serializable" });

  const sent = await deliverAdminInvitation({
    id: invitation.id,
    name: invitation.name,
    email: invitation.email,
    role: invitation.role,
    token,
  });
  if (!sent) {
    await recordSecurityEvent({
      action: "PLATFORM_ADMIN_INVITATION_EMAIL_FAILED",
      actorAdminId: actor.id,
      ipAddress,
      metadata: { invitationId: invitation.id },
    });
    revalidatePath("/admin/administrators");
    return failure("The invitation is saved, but email delivery failed. Retry it from the invitation list.");
  }

  revalidatePath("/admin/administrators");
  return { ok: true, message: "Invitation email sent." };
}

export async function resendPlatformAdminInvitation(invitationId: string): Promise<AdminSecurityActionResult> {
  const actor = await requireSuperAdmin();
  const id = z.string().trim().min(1).max(64).safeParse(invitationId);
  if (!id.success) return failure("Invalid invitation.");
  const requestHeaders = await headers();
  const ipAddress = requestIp(requestHeaders);
  const actorLimit = await consumeAuthRateLimit({
    scope: "platform-admin-invitation-resend-actor",
    subject: actor.id,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!actorLimit || !(await consumeAuthRateLimit({
    scope: "platform-admin-invitation-resend",
    ipAddress,
    subject: actor.id,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  }))) return failure("Invitation limit reached. Try again later.");

  const existing = await rawPrisma.platformAdminInvitation.findUnique({ where: { id: id.data } });
  if (!existing || existing.usedAt || existing.revokedAt) return failure("This invitation is no longer available.");
  if (existing.adminId) {
    const pendingAdmin = await rawPrisma.platformAdmin.findUnique({ where: { id: existing.adminId } });
    if (!pendingAdmin || pendingAdmin.email !== existing.email || pendingAdmin.isActive) {
      return failure("This administrator account has already been activated or changed.");
    }
  } else {
    const existingAdmin = await rawPrisma.platformAdmin.findUnique({
      where: { email: existing.email },
      select: { id: true },
    });
    if (existingAdmin) return failure("This administrator account has already been activated.");
  }

  const token = createSecurityToken();
  const replacement = await rawPrisma.$transaction(async (tx) => {
    await tx.platformAdminInvitation.updateMany({
      where: { email: existing.email, usedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    const created = await tx.platformAdminInvitation.create({
      data: {
        adminId: existing.adminId,
        name: existing.name,
        email: existing.email,
        role: existing.role,
        tokenHash: hashSecurityToken(token),
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });
    await tx.securityEvent.create({
      data: {
        action: "PLATFORM_ADMIN_INVITATION_RESENT",
        actorAdminId: actor.id,
        targetAdminId: existing.adminId,
        ipAddress,
        metadata: { invitationId: existing.id, replacementId: created.id },
      },
    });
    return created;
  }, { isolationLevel: "Serializable" });

  const sent = await deliverAdminInvitation({
    id: replacement.id,
    name: replacement.name,
    email: replacement.email,
    role: replacement.role,
    token,
  });
  if (!sent) {
    await recordSecurityEvent({
      action: "PLATFORM_ADMIN_INVITATION_EMAIL_FAILED",
      actorAdminId: actor.id,
      targetAdminId: existing.adminId,
      ipAddress,
      metadata: { invitationId: replacement.id },
    });
  }
  revalidatePath("/admin/administrators");
  return sent
    ? { ok: true, message: "A new invitation link was sent. The previous link is invalid." }
    : failure("The invitation link was rotated, but email delivery failed. Retry it from the list.");
}

export async function revokePlatformAdminInvitation(invitationId: string): Promise<AdminSecurityActionResult> {
  const actor = await requireSuperAdmin();
  const id = z.string().trim().min(1).max(64).safeParse(invitationId);
  if (!id.success) return failure("Invalid invitation.");

  const now = new Date();
  const invitation = await rawPrisma.$transaction(async (tx) => {
    const pending = await tx.platformAdminInvitation.findFirst({
      where: { id: id.data, usedAt: null, revokedAt: null },
      select: { id: true, adminId: true },
    });
    if (!pending) return false;
    const result = await tx.platformAdminInvitation.updateMany({
      where: { id: pending.id, usedAt: null, revokedAt: null },
      data: { revokedAt: now },
    });
    if (result.count !== 1) return false;
    await tx.securityEvent.create({
      data: {
        action: "PLATFORM_ADMIN_INVITATION_REVOKED",
        actorAdminId: actor.id,
        targetAdminId: pending.adminId,
        metadata: { invitationId: pending.id },
      },
    });
    return true;
  });
  if (!invitation) return failure("This invitation is no longer available.");
  revalidatePath("/admin/administrators");
  return { ok: true, message: "Invitation revoked." };
}

export async function acceptPlatformAdminInvitation(raw: unknown): Promise<AdminSecurityActionResult> {
  const parsed = tokenPasswordSchema.safeParse(raw);
  if (!parsed.success) return failure("Enter a valid password of at least 15 characters.");
  const requestHeaders = await headers();
  const ipAddress = requestIp(requestHeaders);
  const tokenHash = hashSecurityToken(parsed.data.token);
  if (!(await consumeAuthRateLimit({
    scope: "platform-admin-invitation-accept",
    ipAddress,
    subject: tokenHash,
    limit: 8,
    windowMs: 30 * 60 * 1000,
  }))) return failure("This invitation is invalid or expired. Ask a Super Admin for a new one.");

  const invitation = await rawPrisma.platformAdminInvitation.findUnique({ where: { tokenHash } });
  if (
    !invitation ||
    invitation.usedAt ||
    invitation.revokedAt ||
    invitation.deliveryStatus !== "SENT" ||
    invitation.expiresAt <= new Date()
  ) {
    if (invitation && !invitation.usedAt && !invitation.revokedAt && invitation.expiresAt <= new Date()) {
      const expiredAt = new Date();
      const marked = await rawPrisma.platformAdminInvitation.updateMany({
        where: {
          id: invitation.id,
          usedAt: null,
          revokedAt: null,
          expiredAt: null,
          expiresAt: { lte: expiredAt },
        },
        data: { expiredAt },
      });
      if (marked.count === 1) {
        await recordSecurityEvent({
          action: "PLATFORM_ADMIN_INVITATION_EXPIRED",
          targetAdminId: invitation.adminId,
          ipAddress,
          metadata: { invitationId: invitation.id },
        });
      }
    }
    return failure("This invitation is invalid or expired. Ask a Super Admin for a new one.");
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const now = new Date();
  const accepted = await rawPrisma.$transaction(async (tx) => {
    const claim = await tx.platformAdminInvitation.updateMany({
      where: {
        id: invitation.id,
        usedAt: null,
        revokedAt: null,
        deliveryStatus: "SENT",
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });
    if (claim.count !== 1) return false;
    if (await tx.user.findUnique({ where: { email: invitation.email }, select: { id: true } })) return false;

    let adminId = invitation.adminId;
    if (adminId) {
      const admin = await tx.platformAdmin.findUnique({ where: { id: adminId } });
      if (!admin || admin.isActive || admin.email !== invitation.email) return false;
      await tx.platformAdmin.update({
        where: { id: adminId },
        data: { name: invitation.name, role: invitation.role, passwordHash, mustResetPassword: false, isActive: true },
      });
    } else {
      const created = await tx.platformAdmin.create({
        data: {
          name: invitation.name,
          email: invitation.email,
          role: invitation.role,
          passwordHash,
          mustResetPassword: false,
          isActive: true,
        },
        select: { id: true },
      });
      adminId = created.id;
    }

    await tx.platformAdminInvitation.updateMany({
      where: { email: invitation.email, usedAt: null, revokedAt: null },
      data: { revokedAt: now },
    });
    await tx.securityEvent.create({
      data: {
        action: "PLATFORM_ADMIN_INVITATION_ACCEPTED",
        targetAdminId: adminId,
        ipAddress,
      },
    });
    return true;
  });

  return accepted
    ? { ok: true, message: "Administrator account set up. You can now sign in." }
    : failure("This invitation is invalid or expired. Ask a Super Admin for a new one.");
}

export async function updatePlatformAdmin(raw: unknown): Promise<AdminSecurityActionResult> {
  const actor = await requireSuperAdmin();
  const parsed = z.object({
    id: z.string().trim().min(1).max(64),
    name: z.string().trim().min(2).max(120),
    role: platformAdminRoleSchema,
    isActive: z.boolean(),
  }).safeParse(raw);
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Enter valid administrator details.");

  if (actor.id === parsed.data.id && !parsed.data.isActive) return failure("You cannot deactivate your own account.");
  const requestHeaders = await headers();
  const ipAddress = requestIp(requestHeaders);
  const updated = await rawPrisma.$transaction(async (tx) => {
    const target = await tx.platformAdmin.findUnique({ where: { id: parsed.data.id } });
    if (!target) return { ok: false as const, message: "Administrator not found." };
    if (target.id === actor.id && target.role !== parsed.data.role) {
      return { ok: false as const, message: "You cannot change your own administrator role." };
    }
    if (
      target.isActive &&
      target.role === "SUPER_ADMIN" &&
      (!parsed.data.isActive || parsed.data.role !== "SUPER_ADMIN")
    ) {
      const activeSuperAdmins = await tx.platformAdmin.count({
        where: { isActive: true, role: "SUPER_ADMIN" },
      });
      if (activeSuperAdmins <= 1) {
        return { ok: false as const, message: "The final active Super Admin cannot be deactivated or demoted." };
      }
    }

    await tx.platformAdmin.update({
      where: { id: target.id },
      data: { name: parsed.data.name, role: parsed.data.role, isActive: parsed.data.isActive },
    });
    if (target.isActive && !parsed.data.isActive) {
      await tx.adminSession.deleteMany({ where: { adminId: target.id } });
    }
    await tx.securityEvent.create({
      data: {
        action:
          target.role !== parsed.data.role ? "PLATFORM_ADMIN_ROLE_CHANGED" :
          target.isActive !== parsed.data.isActive ? (parsed.data.isActive ? "PLATFORM_ADMIN_REACTIVATED" : "PLATFORM_ADMIN_DEACTIVATED") :
          "PLATFORM_ADMIN_UPDATED",
        actorAdminId: actor.id,
        targetAdminId: target.id,
        ipAddress,
        metadata: {
          previousRole: target.role,
          role: parsed.data.role,
          wasActive: target.isActive,
          isActive: parsed.data.isActive,
        },
      },
    });
    return { ok: true as const, message: "Administrator updated." };
  }, { isolationLevel: "Serializable" });

  if (!updated.ok) return failure(updated.message);
  revalidatePath("/admin/administrators");
  revalidatePath("/admin");
  return updated;
}

export async function requestPlatformAdminPasswordReset(raw: unknown): Promise<AdminSecurityActionResult> {
  const parsed = z.object({ email: z.string().trim().email().max(254) }).safeParse(raw);
  if (!parsed.success) return failure("Enter a valid email address.");
  const requestHeaders = await headers();
  const ipAddress = requestIp(requestHeaders);
  const email = parsed.data.email.toLowerCase();
  const ipAllowed = await consumeAuthRateLimit({
    scope: "platform-admin-password-reset-ip",
    ipAddress,
    limit: 8,
    windowMs: 15 * 60 * 1000,
  });
  const emailAllowed = await consumeAuthRateLimit({
    scope: "platform-admin-password-reset-email",
    subject: email,
    limit: 3,
    windowMs: 30 * 60 * 1000,
  });
  if (!ipAllowed || !emailAllowed) return { ok: true, message: "If an active administrator account exists for that address, a reset link will be sent." };

  const admin = await rawPrisma.platformAdmin.findFirst({ where: { email, isActive: true } });
  if (!admin) return { ok: true, message: "If an active administrator account exists for that address, a reset link will be sent." };

  const token = createSecurityToken();
  const reset = await rawPrisma.$transaction(async (tx) => {
    await tx.platformAdminPasswordReset.updateMany({
      where: { adminId: admin.id, usedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    const created = await tx.platformAdminPasswordReset.create({
      data: {
        adminId: admin.id,
        tokenHash: hashSecurityToken(token),
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });
    await tx.securityEvent.create({
      data: { action: "PLATFORM_ADMIN_PASSWORD_RESET_REQUESTED", targetAdminId: admin.id, ipAddress },
    });
    return created;
  });

  try {
    const url = `${securityEmailBaseUrl()}/admin/reset-password?token=${token}`;
    await sendSecurityEmail({
      recipient: admin.email,
      subject: "Reset your DukaOS administrator password",
      message: `Reset your administrator password using this link: ${url}\n\nThis link expires in 30 minutes.`,
      html: brandedEmail({
        preheader: "Reset your DukaOS administrator password.",
        eyebrow: "Account security",
        title: "Reset your administrator password",
        body: "We received a request to reset your administrator password. Use the secure link below to choose a new password. This link expires in 30 minutes. All active administrator sessions will be revoked after a successful reset.",
        cta: { label: "Reset password", url },
      }),
    });
    await rawPrisma.platformAdminPasswordReset.update({
      where: { id: reset.id },
      data: { deliveryStatus: "SENT" },
    });
  } catch (error) {
    await rawPrisma.platformAdminPasswordReset.update({
      where: { id: reset.id },
      data: { deliveryStatus: "FAILED" },
    });
    await recordSecurityEvent({
      action: "PLATFORM_ADMIN_PASSWORD_RESET_EMAIL_FAILED",
      targetAdminId: admin.id,
      ipAddress,
    });
    console.error("[platform-admin] password reset email failed", {
      adminId: admin.id,
      reason: error instanceof Error ? error.message : "unknown",
    });
  }

  return { ok: true, message: "If an active administrator account exists for that address, a reset link will be sent." };
}

export async function resetPlatformAdminPassword(raw: unknown): Promise<AdminSecurityActionResult> {
  const parsed = tokenPasswordSchema.safeParse(raw);
  if (!parsed.success) return failure("Enter a valid password of at least 15 characters.");
  const requestHeaders = await headers();
  const ipAddress = requestIp(requestHeaders);
  const tokenHash = hashSecurityToken(parsed.data.token);
  if (!(await consumeAuthRateLimit({
    scope: "platform-admin-password-reset-submit",
    ipAddress,
    subject: tokenHash,
    limit: 8,
    windowMs: 30 * 60 * 1000,
  }))) return failure("This reset link is invalid or expired. Request a new one.");

  const reset = await rawPrisma.platformAdminPasswordReset.findUnique({
    where: { tokenHash },
    select: { id: true, adminId: true, expiresAt: true, usedAt: true, revokedAt: true, deliveryStatus: true },
  });
  if (
    !reset ||
    reset.usedAt ||
    reset.revokedAt ||
    reset.deliveryStatus !== "SENT" ||
    reset.expiresAt <= new Date()
  ) return failure("This reset link is invalid or expired. Request a new one.");

  const admin = await rawPrisma.platformAdmin.findFirst({
    where: { id: reset.adminId, isActive: true },
    select: { id: true },
  });
  if (!admin) return failure("This reset link is invalid or expired. Request a new one.");
  const passwordHash = await hashPassword(parsed.data.password);
  const now = new Date();
  const changed = await rawPrisma.$transaction(async (tx) => {
    const claimed = await tx.platformAdminPasswordReset.updateMany({
      where: {
        id: reset.id,
        usedAt: null,
        revokedAt: null,
        deliveryStatus: "SENT",
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) return false;
    const activeAdmin = await tx.platformAdmin.findFirst({
      where: { id: reset.adminId, isActive: true },
      select: { id: true },
    });
    if (!activeAdmin) return false;
    await tx.platformAdmin.update({
      where: { id: reset.adminId },
      data: { passwordHash, mustResetPassword: false },
    });
    await tx.platformAdminPasswordReset.updateMany({
      where: { adminId: reset.adminId, usedAt: null, revokedAt: null },
      data: { revokedAt: now },
    });
    await tx.adminSession.deleteMany({ where: { adminId: reset.adminId } });
    await tx.securityEvent.create({
      data: {
        action: "PLATFORM_ADMIN_PASSWORD_RESET",
        targetAdminId: reset.adminId,
        ipAddress,
      },
    });
    return true;
  });

  return changed
    ? { ok: true, message: "Password updated. Sign in with your new password." }
    : failure("This reset link is invalid or expired. Request a new one.");
}
