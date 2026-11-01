import "server-only";
import { createHash, randomBytes } from "crypto";
import { rawPrisma } from "@/server/db/client";
import { sendMessage, type MessageInput } from "@/server/services/messaging";

export function createSecurityToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashSecurityToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function securityEmailBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configuredUrl) throw new Error("NEXT_PUBLIC_APP_URL is not configured.");

  const url = new URL(configuredUrl);
  if (
    (process.env.NODE_ENV === "production" && url.protocol !== "https:") ||
    (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error("NEXT_PUBLIC_APP_URL must be a valid application URL.");
  }

  return url.toString().replace(/\/$/, "");
}

export async function sendSecurityEmail(input: Omit<MessageInput, "channel">): Promise<void> {
  const hasApiKey = Boolean(process.env.RESEND_API_KEY?.trim() || process.env.EMAIL_API_KEY?.trim());
  const sender = process.env.EMAIL_FROM?.trim();
  if (!hasApiKey || !sender) {
    throw new Error("Security email delivery is not configured.");
  }
  if (process.env.NODE_ENV === "production" && /@[^>]*resend\.dev/i.test(sender)) {
    throw new Error("Production security email must use a verified sender domain.");
  }

  await sendMessage({ ...input, channel: "email" });
}

export async function consumeAuthRateLimit(input: {
  scope: string;
  limit: number;
  windowMs: number;
  ipAddress?: string | null;
  subject?: string | null;
}): Promise<boolean> {
  const key = createHash("sha256")
    .update(`${input.scope}\u0000${input.ipAddress ?? "unknown"}\u0000${input.subject?.trim().toLowerCase() ?? ""}`)
    .digest("hex");
  const now = new Date();
  const cutoff = new Date(now.getTime() - input.windowMs);
  const rows = await rawPrisma.$queryRaw<Array<{ hits: number }>>`
    INSERT INTO "auth_rate_limit_buckets" ("key", "windowStartedAt", "hits")
    VALUES (${key}, ${now}, 1)
    ON CONFLICT ("key") DO UPDATE SET
      "windowStartedAt" = CASE
        WHEN "auth_rate_limit_buckets"."windowStartedAt" <= ${cutoff} THEN ${now}
        ELSE "auth_rate_limit_buckets"."windowStartedAt"
      END,
      "hits" = CASE
        WHEN "auth_rate_limit_buckets"."windowStartedAt" <= ${cutoff} THEN 1
        ELSE "auth_rate_limit_buckets"."hits" + 1
      END
    RETURNING "hits"
  `;

  if (rows[0]?.hits === 1 || (rows[0]?.hits ?? 0) % 100 === 0) {
    await rawPrisma.$executeRaw`
      DELETE FROM "auth_rate_limit_buckets"
      WHERE "windowStartedAt" < ${new Date(now.getTime() - 24 * 60 * 60 * 1000)}
    `;
  }
  return (rows[0]?.hits ?? input.limit + 1) <= input.limit;
}

export async function recordSecurityEvent(input: {
  action: string;
  actorAdminId?: string | null;
  targetAdminId?: string | null;
  targetUserId?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}): Promise<void> {
  await rawPrisma.securityEvent.create({
    data: {
      action: input.action,
      actorAdminId: input.actorAdminId ?? null,
      targetAdminId: input.targetAdminId ?? null,
      targetUserId: input.targetUserId ?? null,
      ipAddress: input.ipAddress ?? null,
      metadata: input.metadata ?? undefined,
    },
  });
}
