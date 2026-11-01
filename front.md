# DukaOS Front Page

The public front page lives at the application root (`/`). Signed-out visitors see the marketing page; authenticated visitors continue to be redirected to `/dashboard`.

## Run locally

From the repository root:

```powershell
npm install
npm run dev
```

Open [https://dukapos-theta.vercel.app](https://dukapos-theta.vercel.app) in a browser. Use **Get started** or **Start your workspace** to open `/register`, or **Log in** to open `/login`.

## Registration and activation flow

1. The client chooses Starter, Growth, or Enterprise during registration.
2. DukaOS creates the business and selected subscription with `pending_payment` status.
3. The client is sent to `/account-pending`, where they can contact DukaOS on WhatsApp at `+254757308631`. The message includes their email and selected package.
4. Dashboard access is blocked by the server until the subscription is confirmed.
5. After payment is verified, an authorised operator must change that subscription status to `active`. The client can then log in and use the dashboard.

For a manual confirmation, use Prisma Studio or your approved database administration process, find the organization subscription, and change only `status` to `active`. Do not expose an unauthenticated public activation endpoint. A payment gateway can replace this step later once verified provider credentials and webhook handling are configured.

## Validate a production build

```powershell
npm run lint
npm run build
```

The landing page is implemented in `src/components/marketing-landing-page.tsx`. It includes the product story, business problems, detailed feature groups, interactive product tour, sales/purchase/credit workflows, industries, onboarding, pricing cards, feature comparison, security, and FAQ. The root route checks the current session in `src/app/page.tsx`, so no authentication or dashboard routes need to be changed to use the front page.

## Content and pricing

The page uses DukaOS capabilities already present in the application: POS, inventory, purchases, customers, suppliers, branches, roles, reports, and customer credit. Pricing is intentionally described by package maturity rather than hardcoded KES amounts because the repository does not currently define public subscription prices. Update the `plans` data in `src/components/marketing-landing-page.tsx` when approved prices are available. The registration package list is in `src/app/(auth)/register/register-form.tsx` and the package limits are enforced in `src/app/actions/auth.ts`.
