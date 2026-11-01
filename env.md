# â”€â”€ Database â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Local PostgreSQL for development (Docker or local install)
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
# Direct connection (used by Prisma Migrate)
DIRECT_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

# â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
AUTH_SECRET="replace-with-a-random-secret"
NEXT_PUBLIC_APP_URL="https://dukapos-theta.vercel.app"
# Set only for the one-time bootstrap command when no active admin exists.
INITIAL_SUPER_ADMIN_EMAIL=""
INITIAL_SUPER_ADMIN_NAME=""

# â”€â”€ M-Pesa (Safaricom Daraja) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Stored per-organization in DB in production; these are fallback/dev values.
M_PESA_ENV="sandbox"
M_PESA_CONSUMER_KEY=""
M_PESA_CONSUMER_SECRET=""
M_PESA_PASSKEY=""
M_PESA_SHORTCODE=""
M_PESA_CALLBACK_URL=""
MPESA_CALLBACK_SECRET=""

# â”€â”€ eTIMS adapter (optional, server-only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# The official KRA adapter contract must be supplied before production use.
ETIMS_ENABLED="false"
ETIMS_API_URL=""
ETIMS_API_KEY=""
ETIMS_CLIENT_ID=""
ETIMS_CLIENT_SECRET=""
ETIMS_ENVIRONMENT="SANDBOX"
ETIMS_ENCRYPTION_KEY=""

# â”€â”€ Messaging â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
EMAIL_API_KEY=""
RESEND_API_KEY=""
CONTACT_TO_EMAIL="leonochieng436@gmail.com"
EMAIL_FROM="DukaOS <onboarding@resend.dev>"
SMS_API_KEY=""
SMS_USERNAME=""
WHATSAPP_API_KEY=""
WHATSAPP_PHONE_NUMBER_ID=""
# Public click-to-chat business number, international format; digits preferred.
NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER="254757308631"

# â”€â”€ Object storage (product images, receipts, attachments) â”€
STORAGE_ENDPOINT=""
STORAGE_ACCESS_KEY_ID=""
STORAGE_SECRET_ACCESS_KEY=""
STORAGE_BUCKET=""
STORAGE_REGION=""

# â”€â”€ Generic card/bank payment provider (future) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
PAYMENT_PROVIDER_API_KEY=""

# â”€â”€ Stripe subscriptions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_STARTER_PRICE_ID=""
STRIPE_GROWTH_PRICE_ID=""
STRIPE_ENTERPRISE_PRICE_ID=""

# â”€â”€ AI support assistant (optional) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Any OpenAI-compatible chat completions endpoint can be used.
SUPPORT_AI_API_KEY=""
SUPPORT_AI_API_URL=""
SUPPORT_AI_MODEL="gpt-4o-mini"

# â”€â”€ Scheduled jobs (Vercel Cron) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Shared secret Vercel Cron sends as a header so /api/cron/* routes can
# verify the request actually came from the scheduler, not the public
# internet. Generate with: openssl rand -hex 32
CRON_SECRET=""

# NOTE: Never prefix secrets with NEXT_PUBLIC_. Only non-secret,
# client-safe values (like NEXT_PUBLIC_APP_URL) may use that prefix.

