-- Platform admin lifecycle, invitations, recovery, audit, and rate limiting.
CREATE TYPE "PlatformAdminRole" AS ENUM ('ADMIN', 'SUPER_ADMIN');
CREATE TYPE "SecurityEmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

ALTER TABLE "PlatformAdmin"
ADD COLUMN "role" "PlatformAdminRole" NOT NULL DEFAULT 'ADMIN',
ADD COLUMN "mustResetPassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lastLoginAt" TIMESTAMP(3);

UPDATE "PlatformAdmin"
SET "isActive" = false, "mustResetPassword" = true;
DELETE FROM "admin_sessions";

ALTER TABLE "password_reset_tokens"
ADD COLUMN "revokedAt" TIMESTAMP(3),
ADD COLUMN "deliveryStatus" "SecurityEmailStatus" NOT NULL DEFAULT 'PENDING';

CREATE INDEX "password_reset_tokens_userId_createdAt_idx"
ON "password_reset_tokens"("userId", "createdAt");

CREATE TABLE "platform_admin_invitations" (
    "id" TEXT NOT NULL,
    "adminId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "PlatformAdminRole" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "deliveryStatus" "SecurityEmailStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "platform_admin_invitations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "platform_admin_invitations_adminId_fkey"
        FOREIGN KEY ("adminId") REFERENCES "PlatformAdmin"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "platform_admin_invitations_tokenHash_key"
ON "platform_admin_invitations"("tokenHash");
CREATE INDEX "platform_admin_invitations_adminId_idx"
ON "platform_admin_invitations"("adminId");
CREATE INDEX "platform_admin_invitations_email_createdAt_idx"
ON "platform_admin_invitations"("email", "createdAt");
CREATE INDEX "platform_admin_invitations_expiresAt_usedAt_revokedAt_idx"
ON "platform_admin_invitations"("expiresAt", "usedAt", "revokedAt");

CREATE TABLE "platform_admin_password_resets" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "deliveryStatus" "SecurityEmailStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "platform_admin_password_resets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "platform_admin_password_resets_adminId_fkey"
        FOREIGN KEY ("adminId") REFERENCES "PlatformAdmin"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "platform_admin_password_resets_tokenHash_key"
ON "platform_admin_password_resets"("tokenHash");
CREATE INDEX "platform_admin_password_resets_adminId_createdAt_idx"
ON "platform_admin_password_resets"("adminId", "createdAt");
CREATE INDEX "platform_admin_password_resets_expiresAt_usedAt_revokedAt_idx"
ON "platform_admin_password_resets"("expiresAt", "usedAt", "revokedAt");

CREATE TABLE "security_events" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorAdminId" TEXT,
    "targetAdminId" TEXT,
    "targetUserId" TEXT,
    "ipAddress" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "security_events_createdAt_idx" ON "security_events"("createdAt");
CREATE INDEX "security_events_targetAdminId_createdAt_idx"
ON "security_events"("targetAdminId", "createdAt");
CREATE INDEX "security_events_action_createdAt_idx"
ON "security_events"("action", "createdAt");

CREATE TABLE "auth_rate_limit_buckets" (
    "key" TEXT NOT NULL,
    "windowStartedAt" TIMESTAMP(3) NOT NULL,
    "hits" INTEGER NOT NULL,
    CONSTRAINT "auth_rate_limit_buckets_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "auth_rate_limit_buckets_windowStartedAt_idx"
ON "auth_rate_limit_buckets"("windowStartedAt");
