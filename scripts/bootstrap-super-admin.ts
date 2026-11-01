import { createHash, randomBytes } from "node:crypto";
import { PrismaClient, PlatformAdminRole } from "@prisma/client";
import { Resend } from "resend";
import { hashPassword } from "../src/server/auth/password";

const prisma = new PrismaClient();
const invitationTtlMs = 30 * 60 * 1000;

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} must be configured.`);
  return value;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    "\"": "&quot;",
  })[char] ?? char);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function securityEmailConfig() {
  const appUrl = new URL(required("NEXT_PUBLIC_APP_URL"));
  if (
    (process.env.NODE_ENV === "production" && appUrl.protocol !== "https:") ||
    (appUrl.protocol !== "https:" && appUrl.hostname !== "localhost" && appUrl.hostname !== "127.0.0.1") ||
    appUrl.username ||
    appUrl.password ||
    appUrl.search ||
    appUrl.hash
  ) throw new Error("NEXT_PUBLIC_APP_URL must be a valid application URL.");

  const from = required("EMAIL_FROM");
  if (process.env.NODE_ENV === "production" && /@[^>]*resend\.dev/i.test(from)) {
    throw new Error("Production bootstrap requires a verified EMAIL_FROM domain.");
  }
  const apiKey = process.env.RESEND_API_KEY?.trim() || process.env.EMAIL_API_KEY?.trim();
  if (!apiKey) throw new Error("RESEND_API_KEY or EMAIL_API_KEY must be configured.");
  return { appUrl: appUrl.toString().replace(/\/$/, ""), from, apiKey };
}

async function sendInvitation(input: {
  id: string;
  email: string;
  name: string;
  token: string;
  from: string;
  apiKey: string;
  appUrl: string;
}): Promise<void> {
  const url = `${input.appUrl}/admin/accept-invitation?token=${input.token}`;
  const result = await new Resend(input.apiKey).emails.send({
    from: input.from,
    to: [input.email],
    subject: "Your DukaOS Super Admin invitation",
    text: `Hello ${input.name}, accept your DukaOS Super Admin invitation and set your password using this link: ${url}\n\nThe link expires in 30 minutes.`,
    html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#102b4e"><h1>Set up your Super Admin account</h1><p>Hello ${escapeHtml(input.name)},</p><p>This one-time link lets you set your own password. It expires in 30 minutes.</p><p><a href="${escapeHtml(url)}">Accept invitation</a></p><p>If you did not expect this invitation, contact your deployment administrator.</p></body></html>`,
  });
  if (result.error || !result.data?.id) {
    throw new Error(`Invitation email could not be submitted${result.error ? `: ${result.error.message}` : "."}`);
  }
  await prisma.platformAdminInvitation.update({
    where: { id: input.id },
    data: { deliveryStatus: "SENT" },
  });
}

async function main() {
  const email = required("INITIAL_SUPER_ADMIN_EMAIL").toLowerCase();
  const name = required("INITIAL_SUPER_ADMIN_NAME");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || name.length < 2 || name.length > 120) {
    throw new Error("Provide a valid INITIAL_SUPER_ADMIN_EMAIL and a name from 2 to 120 characters.");
  }
  const mail = securityEmailConfig();
  const token = randomBytes(32).toString("hex");
  const temporaryHash = await hashPassword(randomBytes(48).toString("base64url"));
  const invitation = await prisma.$transaction(async (tx) => {
    const previousBootstrap = await tx.securityEvent.findFirst({
      where: { action: "PLATFORM_ADMIN_BOOTSTRAP" },
      orderBy: { createdAt: "asc" },
      select: { targetAdminId: true },
    });
    let admin;
    if (previousBootstrap) {
      if (!previousBootstrap.targetAdminId) {
        throw new Error("Bootstrap was already consumed. Use the documented recovery procedure.");
      }
      const priorAdmin = await tx.platformAdmin.findUnique({
        where: { id: previousBootstrap.targetAdminId },
      });
      if (
        !priorAdmin ||
        priorAdmin.email !== email ||
        priorAdmin.isActive ||
        !priorAdmin.mustResetPassword ||
        priorAdmin.role !== PlatformAdminRole.SUPER_ADMIN
      ) {
        throw new Error("Bootstrap was already consumed. Use the documented recovery procedure.");
      }
      admin = await tx.platformAdmin.update({
        where: { id: priorAdmin.id },
        data: { name, passwordHash: temporaryHash },
      });
    } else {
      const activeAdminsNotForcedToReset = await tx.platformAdmin.count({
        where: { isActive: true, mustResetPassword: false },
      });
      const existingSuperAdmins = await tx.platformAdmin.count({
        where: { role: PlatformAdminRole.SUPER_ADMIN },
      });
      if (activeAdminsNotForcedToReset !== 0 || existingSuperAdmins !== 0) {
        throw new Error("Bootstrap is allowed only before a Super Admin is initialized and while any legacy active accounts are forced to reset their passwords.");
      }
      if (await tx.user.findUnique({ where: { email }, select: { id: true } })) {
        throw new Error("The configured email already belongs to a business account. Use a distinct verified administrator address.");
      }
      const existing = await tx.platformAdmin.findUnique({ where: { email } });
      admin = existing
        ? await tx.platformAdmin.update({
            where: { id: existing.id },
            data: { name, role: PlatformAdminRole.SUPER_ADMIN, isActive: false, mustResetPassword: true, passwordHash: temporaryHash },
          })
        : await tx.platformAdmin.create({
            data: { name, email, role: PlatformAdminRole.SUPER_ADMIN, isActive: false, mustResetPassword: true, passwordHash: temporaryHash },
          });
      await tx.securityEvent.create({
        data: {
          action: "PLATFORM_ADMIN_BOOTSTRAP",
          targetAdminId: admin.id,
          metadata: { email },
        },
      });
    }

    await tx.adminSession.deleteMany({ where: { adminId: admin.id } });
    await tx.platformAdminInvitation.updateMany({
      where: { adminId: admin.id, usedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    const created = await tx.platformAdminInvitation.create({
      data: {
        adminId: admin.id,
        name,
        email,
        role: PlatformAdminRole.SUPER_ADMIN,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + invitationTtlMs),
      },
    });
    if (previousBootstrap) {
      await tx.securityEvent.create({
        data: {
          action: "PLATFORM_ADMIN_BOOTSTRAP_INVITATION_RESENT",
          targetAdminId: admin.id,
        },
      });
    }
    return created;
  }, { isolationLevel: "Serializable", maxWait: 10_000, timeout: 30_000 });

  try {
    await sendInvitation({
      id: invitation.id,
      email,
      name,
      token,
      ...mail,
    });
    console.log("Bootstrap invitation email submitted. The recipient must set a password before signing in.");
  } catch (error) {
    await prisma.platformAdminInvitation.update({
      where: { id: invitation.id },
      data: { deliveryStatus: "FAILED" },
    });
    await prisma.securityEvent.create({
      data: {
        action: "PLATFORM_ADMIN_BOOTSTRAP_INVITATION_EMAIL_FAILED",
        targetAdminId: invitation.adminId,
      },
    });
    console.error("Bootstrap invitation email failed. The pending invitation is stored; rerun the command for a new one-time link.", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Super Admin bootstrap failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
