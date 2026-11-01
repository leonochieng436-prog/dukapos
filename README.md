# DukaOS â€” POS & Business Management SaaS

A multi-tenant Point of Sale and business operating system for Kenyan
SMEs (retail, supermarkets, pharmacies, restaurants, wholesalers, and
more), built to expand across Africa. See `ARCHITECTURE.md` for the
system design and `DATABASE.md` for the data model.

**Current status: Phases 1â€“2 complete.** Auth, multi-tenant
organizations, RBAC, branch/team management, the product catalog
(products, variants, categories, brands, barcodes), and the inventory
ledger (stock levels, FIFO cost batches, stock adjustments) are live
and real â€” everything else in the roadmap below is intentionally not
yet built (see `DEVELOPMENT ROADMAP` in `ARCHITECTURE.md`), rather than
faked.

## Stack

- Next.js (App Router) + TypeScript (strict) + Tailwind CSS
- PostgreSQL + Prisma ORM
- Server Actions for mutations, Zod for validation
- DB-backed sessions (httpOnly cookies), bcrypt password hashing

## Getting started

### 1. Prerequisites

- Node.js 20+
- A PostgreSQL database (local, or a provider like [Neon](https://neon.tech) or [Supabase](https://supabase.com))

### 2. Install

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in at minimum `DATABASE_URL` and `DIRECT_URL`. Generate a secret for
`AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 4. Set up the database

```bash
npm run db:generate   # generate the Prisma client from schema.prisma
npm run db:migrate    # create and apply the initial migration
npm run db:seed       # seed the global permission catalog + demo tenant
```

> The seed script prints demo login credentials to the console. In a
> real environment, override them first:
> `SEED_OWNER_PASSWORD=... SEED_CASHIER_PASSWORD=... npm run db:seed`

### 5. Run the app

```bash
npm run dev
```

Visit `https://dukapos-theta.vercel.app`. Either register a new business, or log
in with the seeded demo account (`owner@leonretail.co.ke`).

### 6. Tests

```bash
npm run test
```

## Project structure

See `ARCHITECTURE.md` â†’ "Folder structure".

## Documentation

| File | Covers |
|---|---|
| `ARCHITECTURE.md` | Module map, tenant isolation strategy, auth/RBAC, transaction architecture, roadmap |
| `DATABASE.md` | Schema walkthrough, the inventory ledger design, ERD notes |
| `API.md` | Server actions surface (Phase 1) and route handler conventions for future phases |
| `SECURITY.md` | Tenant isolation enforcement, auth, secrets handling, threat notes |
| `DEPLOYMENT.md` | Vercel + Neon/Supabase deployment steps |
| `CONTRIBUTING.md` | Development workflow and conventions |

## A note on this build

This codebase was generated in a sandboxed environment without access
to a live Postgres instance or to Prisma's engine binary CDN, so
`prisma generate`/`migrate`/`db seed` could not be executed here, and
the dev server was not booted. The code has been reviewed line-by-line,
linted clean, and the unit tests that don't depend on a generated
Prisma client (RBAC catalog integrity, password hashing, slug
generation â€” 14 tests) pass. **Before relying on this in production,
run the steps in "Getting started" above end-to-end and re-run
`npx tsc --noEmit` once the real Prisma client is generated.**

