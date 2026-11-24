# Warung Nusantara — F&B Ordering with a Pluggable Payment Gateway

A full-stack Next.js 16 App Router demo that combines a simple F&B ordering
flow with a reusable, provider-agnostic payment layer. Development runs on a
zero-dependency Dummy payment provider; switching to Xendit is an environment
variable change, not a feature-code rewrite.

## What it demonstrates

- Feature-based architecture: thin `app/` routes and domain logic in `src/features/`.
- Server Actions with a consistent `ActionResponse<T>` contract.
- A payment adapter boundary: `getPaymentProvider()` in business logic.
- `DummyPay` hosted-invoice simulator that calls the same signed webhook used by
  a real provider.
- Idempotent webhook processing with amount verification.
- Better Auth credential login with role-aware route protection.
- Next.js 16 Cache Components: cached menu catalog, streamed session-dependent UI.
- Prisma 7 + SQLite for local development.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, Cache Components) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Database | SQLite via Prisma 7 + `@prisma/adapter-better-sqlite3` |
| Auth | Better Auth (credential provider) |
| Validation | Zod |
| Payments | Dummy provider (local) / Xendit provider (isolated adapter) |
| UI feedback | Sonner, Lucide icons, Radix Dialog |

## Getting started

```bash
npm install
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Customer | `customer@fnb.local` | `Customer12345` |
| Admin | `admin@fnb.local` | `Admin12345` |

### Environment variables

```env
DATABASE_URL="file:./prisma/dev.db"
BETTER_AUTH_SECRET="a-long-random-secret"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
PAYMENT_PROVIDER="dummy"
PAYMENT_WEBHOOK_SECRET="a-random-webhook-secret"
XENDIT_SECRET_KEY=""
XENDIT_WEBHOOK_TOKEN=""
```

Never expose `BETTER_AUTH_SECRET`, `PAYMENT_WEBHOOK_SECRET`, `XENDIT_SECRET_KEY`,
or `XENDIT_WEBHOOK_TOKEN` through `NEXT_PUBLIC_*` variables.

## How payment works

```text
Cart
  → createOrderAction (auth + Zod + DB-authoritative prices)
  → Order + OrderItems + PaymentTransaction(PENDING)
  → getPaymentProvider().createInvoice()
  → checkoutUrl returned to the client
  → customer pays on the hosted invoice
  → POST /api/webhooks/payment (signed)
  → provider.verifyAndParseWebhook()
  → applyPaymentWebhook() idempotent DB update
  → Order becomes PAID
```

The Dummy provider signs its checkout URL with an HMAC token. The simulator
posts that token to the unified webhook, so the development flow exercises the
same verification and idempotency path as production.

### Switching to Xendit

1. Set `PAYMENT_PROVIDER="xendit"`.
2. Provide `XENDIT_SECRET_KEY` and `XENDIT_WEBHOOK_TOKEN`.
3. Point the Xendit invoice callback URL at `/api/webhooks/payment`.

Only `src/lib/payment/providers/xendit-provider.ts` imports `xendit-node`.

## Project structure

```text
prisma/
  schema.prisma
  seed.ts
prisma.config.ts
src/
  app/                    # routes, layouts, route handlers
    (public)/             # menu + dummy checkout simulator
    (auth)/               # login/register
    (dashboard)/          # customer orders + admin pages
    api/auth/[...all]/    # Better Auth handler
    api/webhooks/payment/ # unified payment webhook
  features/
    auth/                 # actions, forms, schemas
    menu/                 # cached queries, admin CRUD, catalog UI
    orders/               # cart, checkout, order queries, webhook service
    payments/             # dummy checkout query + simulator UI
  components/ui/          # primitives
  components/shared/      # navbar, empty state
  lib/
    auth.ts               # Better Auth config + DAL guards
    db.ts                 # Prisma singleton
    payment/              # adapter contract, factory, providers
  proxy.ts                # optimistic route guard (Next 16 middleware)
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Create/apply Prisma migrations |
| `npm run db:seed` | Seed menu and demo accounts |
| `npm run db:studio` | Open Prisma Studio |

## Verification checklist

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- Log in as the customer, add menu items, check out, pay on DummyPay.
- Re-send the same webhook: it returns `200` with `duplicate: true`.
- Send a webhook with a bad token: it returns `401`.
- Log in as the admin and move the paid order through `PREPARING → COMPLETED`.

## Notes and limitations

- SQLite is intended for local development. Use PostgreSQL for serverless
  deployments where the filesystem is ephemeral.
- Xendit invoices are implemented behind the adapter but were not exercised
  against live test credentials in this repository.
- Refunds, stock counts, and realtime kitchen updates are intentionally out of
  scope for this version.
