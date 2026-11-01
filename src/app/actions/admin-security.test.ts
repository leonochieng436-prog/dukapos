import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    platformAdminInvitation: {
      updateMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    platformAdminPasswordReset: {
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    platformAdmin: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    user: { findUnique: vi.fn() },
    adminSession: { deleteMany: vi.fn() },
    securityEvent: { create: vi.fn() },
  };
  return {
    tx,
    rawPrisma: {
      platformAdminInvitation: {
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      platformAdminPasswordReset: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      platformAdmin: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
      user: { findUnique: vi.fn() },
      adminSession: { deleteMany: vi.fn() },
      securityEvent: { create: vi.fn() },
      $transaction: vi.fn(),
    },
    requireSuperAdmin: vi.fn(),
    consumeAuthRateLimit: vi.fn(),
    createSecurityToken: vi.fn(),
    hashSecurityToken: vi.fn(),
    recordSecurityEvent: vi.fn(),
    securityEmailBaseUrl: vi.fn(),
    sendSecurityEmail: vi.fn(),
    brandedEmail: vi.fn(),
    escapeHtml: vi.fn((value: string) => value),
    headers: vi.fn(),
  };
});

vi.mock("server-only", () => ({}));
vi.mock("@/server/db/client", () => ({ rawPrisma: mocks.rawPrisma }));
vi.mock("@/server/auth/admin-session", () => ({ requireSuperAdmin: mocks.requireSuperAdmin }));
vi.mock("@/server/auth/security", () => ({
  consumeAuthRateLimit: mocks.consumeAuthRateLimit,
  createSecurityToken: mocks.createSecurityToken,
  hashSecurityToken: mocks.hashSecurityToken,
  recordSecurityEvent: mocks.recordSecurityEvent,
  securityEmailBaseUrl: mocks.securityEmailBaseUrl,
  sendSecurityEmail: mocks.sendSecurityEmail,
}));
vi.mock("@/server/services/messaging", () => ({
  brandedEmail: mocks.brandedEmail,
  escapeHtml: mocks.escapeHtml,
}));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  acceptPlatformAdminInvitation,
  invitePlatformAdmin,
  updatePlatformAdmin,
} from "./admin-security";

const actor = { id: "super-1", role: "SUPER_ADMIN" as const };

describe("platform administrator security actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireSuperAdmin.mockResolvedValue(actor);
    mocks.consumeAuthRateLimit.mockResolvedValue(true);
    mocks.createSecurityToken.mockReturnValue("a".repeat(64));
    mocks.hashSecurityToken.mockImplementation((token: string) => `sha256:${token.length}`);
    mocks.securityEmailBaseUrl.mockReturnValue("https://example.test");
    mocks.sendSecurityEmail.mockResolvedValue(undefined);
    mocks.headers.mockResolvedValue(new Headers({ "x-real-ip": "192.0.2.10" }));
    mocks.rawPrisma.$transaction.mockImplementation(
      async (callback: (tx: typeof mocks.tx) => unknown) => callback(mocks.tx),
    );
    mocks.rawPrisma.platformAdmin.findUnique.mockResolvedValue(null);
    mocks.rawPrisma.user.findUnique.mockResolvedValue(null);
    mocks.rawPrisma.platformAdminInvitation.update.mockResolvedValue({});
    mocks.rawPrisma.platformAdminInvitation.updateMany.mockResolvedValue({ count: 1 });
    mocks.tx.platformAdminInvitation.updateMany.mockResolvedValue({ count: 1 });
    mocks.tx.platformAdminInvitation.create.mockResolvedValue({
      id: "invite-1",
      adminId: null,
      name: "Amina Njeri",
      email: "amina@example.test",
      role: "ADMIN",
    });
    mocks.tx.platformAdmin.create.mockResolvedValue({ id: "created-admin" });
    mocks.tx.user.findUnique.mockResolvedValue(null);
    mocks.tx.securityEvent.create.mockResolvedValue({});
  });

  it("denies invitations unless the current session is a Super Admin", async () => {
    mocks.requireSuperAdmin.mockRejectedValue(new Error("SUPER_ADMIN_REQUIRED"));

    await expect(invitePlatformAdmin({
      name: "Amina Njeri",
      email: "amina@example.test",
      role: "ADMIN",
    })).rejects.toThrow("SUPER_ADMIN_REQUIRED");

    expect(mocks.rawPrisma.platformAdminInvitation.findUnique).not.toHaveBeenCalled();
    expect(mocks.rawPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("stores only a token hash and sends an invitation with controlled role", async () => {
    const result = await invitePlatformAdmin({
      name: "Amina Njeri",
      email: "Amina@Example.test",
      role: "ADMIN",
      token: "attacker-controlled",
    });

    expect(result).toEqual({ ok: true, message: "Invitation email sent." });
    expect(mocks.tx.platformAdminInvitation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "amina@example.test",
        role: "ADMIN",
        tokenHash: "sha256:64",
      }),
    });
    expect(mocks.tx.platformAdminInvitation.create.mock.calls[0][0].data.tokenHash)
      .not.toBe("a".repeat(64));
    expect(mocks.sendSecurityEmail).toHaveBeenCalledWith(expect.objectContaining({
      recipient: "amina@example.test",
      subject: "Your DukaOS administrator invitation",
    }));
    expect(mocks.rawPrisma.platformAdminInvitation.update).toHaveBeenCalledWith({
      where: { id: "invite-1" },
      data: { deliveryStatus: "SENT" },
    });
  });

  it("rejects expired invitation tokens without creating an account", async () => {
    mocks.rawPrisma.platformAdminInvitation.findUnique.mockResolvedValue({
      id: "invite-1",
      usedAt: null,
      revokedAt: null,
      deliveryStatus: "SENT",
      expiresAt: new Date(Date.now() - 1000),
    });

    const result = await acceptPlatformAdminInvitation({
      token: "a".repeat(64),
      password: "a-very-long-and-unique-passphrase",
    });

    expect(result.ok).toBe(false);
    expect(mocks.rawPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("accepts a single-use invitation using the stored email and role, not client fields", async () => {
    mocks.rawPrisma.platformAdminInvitation.findUnique.mockResolvedValue({
      id: "invite-1",
      adminId: null,
      name: "Amina Njeri",
      email: "amina@example.test",
      role: "ADMIN",
      usedAt: null,
      revokedAt: null,
      deliveryStatus: "SENT",
      expiresAt: new Date(Date.now() + 60_000),
    });

    const result = await acceptPlatformAdminInvitation({
      token: "a".repeat(64),
      password: "a-very-long-and-unique-passphrase",
      email: "attacker@example.test",
      role: "SUPER_ADMIN",
    });

    expect(result).toEqual({ ok: true, message: "Administrator account set up. You can now sign in." });
    expect(mocks.tx.platformAdmin.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Amina Njeri",
        email: "amina@example.test",
        role: "ADMIN",
        isActive: true,
      }),
      select: { id: true },
    });
    expect(mocks.tx.platformAdminInvitation.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: "invite-1", usedAt: null, revokedAt: null }),
    }));
  });

  it.each([
    ["used", { usedAt: new Date(), revokedAt: null }],
    ["revoked", { usedAt: null, revokedAt: new Date() }],
  ])("rejects a %s invitation token", async (_state, status) => {
    mocks.rawPrisma.platformAdminInvitation.findUnique.mockResolvedValue({
      id: "invite-1",
      ...status,
      deliveryStatus: "SENT",
      expiresAt: new Date(Date.now() + 60_000),
    });

    const result = await acceptPlatformAdminInvitation({
      token: "a".repeat(64),
      password: "a-very-long-and-unique-passphrase",
    });

    expect(result.ok).toBe(false);
    expect(mocks.rawPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("keeps a failed invitation recoverable without reporting delivery success", async () => {
    mocks.sendSecurityEmail.mockRejectedValue(new Error("provider unavailable"));

    const result = await invitePlatformAdmin({
      name: "Amina Njeri",
      email: "amina@example.test",
      role: "ADMIN",
    });

    expect(result).toEqual({
      ok: false,
      message: "The invitation is saved, but email delivery failed. Retry it from the invitation list.",
    });
    expect(mocks.rawPrisma.platformAdminInvitation.update).toHaveBeenCalledWith({
      where: { id: "invite-1" },
      data: { deliveryStatus: "FAILED" },
    });
  });

  it("prevents demotion of the final active Super Admin", async () => {
    mocks.tx.platformAdmin.findUnique.mockResolvedValue({
      id: "other-super",
      role: "SUPER_ADMIN",
      isActive: true,
    });
    mocks.tx.platformAdmin.count.mockResolvedValue(1);

    const result = await updatePlatformAdmin({
      id: "other-super",
      name: "Other Super",
      role: "ADMIN",
      isActive: true,
    });

    expect(result).toEqual({
      ok: false,
      message: "The final active Super Admin cannot be deactivated or demoted.",
    });
    expect(mocks.tx.platformAdmin.update).not.toHaveBeenCalled();
  });
});
