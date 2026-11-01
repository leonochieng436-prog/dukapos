# Deployment

## Target stack

- **App hosting**: Vercel
- **Database**: Neon or Supabase (serverless-friendly Postgres, both
  give you a pooled `DATABASE_URL` + a `DIRECT_URL` for migrations)
- **Object storage** (product images, receipt PDFs, expense
  attachments): any S3-compatible bucket (S3, Cloudflare R2,
  Supabase Storage)

## One-time setup

1. **Create the database.**
   - Neon: create a project, copy the pooled connection string into
     `DATABASE_URL` and the direct (non-pooled) string into
     `DIRECT_URL`.
   - Supabase: Project Settings → Database → Connection string
     (use the "Transaction" pooler for `DATABASE_URL`, "Session" /
     direct for `DIRECT_URL`).

2. **Run migrations against production** (from a machine with network
   access to both the DB and Prisma's engine CDN — CI or your local
   machine, not required to be Vercel itself):
   ```bash
   npm run db:generate
   npm run db:migrate:deploy
   npm run db:seed        # seeds ONLY the global permission catalog in
                           # production (NODE_ENV=production skips the
                           # demo tenant — see prisma/seed.ts)
   ```

3. **Create the Vercel project**, import this repository, and set
   environment variables (Project Settings → Environment Variables)
   using the variable names documented in `env.md`:
   - `DATABASE_URL`, `DIRECT_URL`
   - `AUTH_SECRET` (generate with `openssl rand -base64 32`)
   - `NEXT_PUBLIC_APP_URL` (your production domain)
   - `CONTACT_TO_EMAIL`, `EMAIL_FROM`, and `EMAIL_API_KEY` (or
     `RESEND_API_KEY`) for email delivery. Production administrator
     invitations and password recovery require a verified sender domain;
     do not use Resend's onboarding sender in production.
   - `NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER` in international digits-only
     format (for example `254757308631`) for click-to-chat links. This is a
     public phone number, not an API credential. Click-to-chat opens WhatsApp
     with a pre-filled message; the visitor must press Send.
   - M-Pesa credentials and `MPESA_CALLBACK_SECRET` when the callback adapter
     is enabled; SMS, official WhatsApp API, and storage credentials only when
     those integrations are configured.

4. **Deploy.** Vercel builds with `npm run build`
   (`prisma generate` should also run as part of the build — add a
   `"postinstall": "prisma generate"` script, or a Vercel Build
   Command override of `prisma generate && next build`, once you've
   confirmed `prisma generate` succeeds in your CI network
   environment).

## Migrations after the first deploy

Never run `prisma migrate dev` against production — it's interactive
and can prompt for destructive resets. Use:

```bash
npm run db:migrate:deploy
```

in your deploy pipeline (a Vercel "Ignored Build Step" / GitHub Action
that runs before promoting the deployment is a common pattern).
The inquiry inbox migration (`20261101000000_add_inquiry_inbox`) must be
applied before deploying code that reads the new inquiry tables. For Neon,
`DATABASE_URL` should be pooled for runtime queries and `DIRECT_URL` should
be the direct, non-pooled connection used by Prisma Migrate.

The administrator security migration
(`20261102000000_secure_admin_management`) must also be applied before the
new admin pages or authentication actions are deployed.

## Initial Super Admin and invitations

The security migration adds the platform roles, deactivates every existing
platform administrator, marks each as requiring a password reset, and revokes
all existing admin sessions. This prevents legacy or seeded credentials from
continuing to work during the deployment transition. After the initial Super
Admin is bootstrapped, that Super Admin can reactivate verified existing
accounts; each account must still complete email-based password recovery
before signing in. The development seed no longer creates a platform admin or
a default password.

Set `INITIAL_SUPER_ADMIN_EMAIL` and `INITIAL_SUPER_ADMIN_NAME` for the one-time
bootstrap command, along with
`NEXT_PUBLIC_APP_URL`, `EMAIL_FROM`, and `RESEND_API_KEY` (or the existing
`EMAIL_API_KEY`). Run it only from a trusted deployment/operator environment
after migrations:

```bash
npm run db:generate
npm run db:migrate:deploy
# Deploy the application version containing /admin/accept-invitation.
npm run admin:bootstrap
```

The command is allowed only when no Super Admin has been initialized and no
active administrator can sign in without first resetting a password. It stores
only a hash of a random, single-use, 30-minute token and sends the
configured address an invitation to set its own password. It never prints a
password or token. If email submission fails, the invitation status is stored
as failed; re-running the same bootstrap with the same configured email rotates
that pending link. It refuses to bootstrap another address or run after the
first Super Admin is activated. Keep bootstrap email settings out of normal
app runtime configuration after use.

Super Admins can invite or revoke administrator invitations at
`/admin/administrators`. Invitees set a password from the email link. A
Super Admin can resend a pending invitation; this invalidates the previous
link. Admins who forget a password use **Forgot password?** on the admin sign
in page. Reset links are single-use, expire after 30 minutes, and successful
resets revoke every active platform-admin session. Business accounts continue
to use `/forgot-password`.

### Recovery if all Super Admins lose access

This is an operator-only break-glass procedure, not a public route:

1. Restrict access to the application or put it in maintenance mode.
2. Verify the intended administrator's identity out of band and connect to
   the production database using a privileged, direct database connection.
3. In a transaction, promote exactly one verified existing admin and revoke
   that account's sessions. Record the recovery event. For example, replace
   the email with the verified account and inspect the affected row counts
   before committing:

   ```sql
   BEGIN;
   UPDATE "PlatformAdmin"
   SET "role" = 'SUPER_ADMIN', "isActive" = true, "updatedAt" = CURRENT_TIMESTAMP
   WHERE "email" = lower('verified-admin@example.com')
     AND "role" = 'ADMIN';
   -- Confirm exactly one row changed before continuing.
   DELETE FROM "admin_sessions"
   WHERE "adminId" = (
     SELECT "id" FROM "PlatformAdmin"
     WHERE "email" = lower('verified-admin@example.com')
   );
   INSERT INTO "security_events" ("id", "action", "targetAdminId", "metadata")
   SELECT 'recovery-' || md5(random()::text || clock_timestamp()::text),
          'PLATFORM_ADMIN_BREAK_GLASS_RECOVERY', "id",
          jsonb_build_object('method', 'verified direct database operator')
   FROM "PlatformAdmin"
   WHERE "email" = lower('verified-admin@example.com')
     AND "role" = 'SUPER_ADMIN';
   COMMIT;
   ```

4. Restore the application, sign in, review security events, and invite a
   second Super Admin if appropriate. Do not use the bootstrap script to
   bypass an existing active-admin state.

## Database connection pooling on serverless

Vercel functions are short-lived and can open many concurrent DB
connections; use Neon/Supabase's pooled connection string for
`DATABASE_URL` (Prisma's `directUrl` is only used for migrations, not
at runtime) to avoid exhausting Postgres connection limits.

## Rollback

Because financial/inventory records are voided rather than deleted
(see `SECURITY.md`), a bad deploy's *code* can be rolled back via
Vercel's instant rollback without needing a matching data rollback in
the common case. A migration that changes schema shape is the
exception — write migrations to be backward-compatible with the
previous app version for at least one deploy cycle where feasible.
