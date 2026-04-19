# Selli v2 — Gumroad-Class Selling Platform

> **Sell anything in minutes.** — Beautiful sell pages for digital downloads, coaching, subscriptions, and memberships.

## Overview

Selli v2 is a full-stack Next.js selling platform with:
- **Demo mode** out of the box — works with zero backend setup
- **Adapter architecture** — swap demo adapters for Supabase, Stripe, Resend when ready
- **Full creator dashboard** — products, orders, customers, analytics, discounts, payouts
- **Public sell pages** — `/p/[slug]` and `/store/[sellerSlug]`
- **Real checkout flow** — with coupon codes, order confirmation, digital delivery
- **Premium UI** — minimal, clean, light mode, black/white/gray

## Quick Start

```bash
cd selli-v2-gumroad-engine
npm install
npm run dev
```

Open http://localhost:3000

## Demo Credentials

| Role    | Email                 | Password |
|---------|-----------------------|----------|
| Creator | creator@selli.demo    | demo123  |
| Buyer   | buyer@selli.demo      | demo123  |

Or sign up with any email/password — demo mode accepts anything.

## Key Routes

### Public
| Route | Description |
|---|---|
| `/` | Homepage |
| `/pricing` | Pricing page |
| `/demo` | Live demo showcase |
| `/login` | Login |
| `/signup` | Sign up |
| `/p/[slug]` | Product sell page |
| `/store/[sellerSlug]` | Creator storefront |
| `/checkout/[productId]` | Checkout |
| `/checkout/success` | Success page |
| `/checkout/cancel` | Cancel page |

### Dashboard
| Route | Description |
|---|---|
| `/dashboard` | Overview + charts |
| `/dashboard/products` | Product list |
| `/dashboard/products/new` | Create product |
| `/dashboard/products/[id]` | Edit product |
| `/dashboard/orders` | Orders table |
| `/dashboard/orders/[id]` | Order detail |
| `/dashboard/customers` | Customer list |
| `/dashboard/customers/[id]` | Customer detail |
| `/dashboard/analytics` | Analytics + charts |
| `/dashboard/discounts` | Coupon management |
| `/dashboard/payouts` | Payout history |
| `/dashboard/files` | File assets |
| `/dashboard/storefront` | Storefront editor |
| `/dashboard/billing` | Selli plan management |
| `/dashboard/settings` | Profile settings |

### Internal
| Route | Description |
|---|---|
| `/internal/demo-center` | Dev tools + data reset |

## Architecture

```
src/
├── app/                        # Next.js App Router pages
├── components/
│   ├── ui/                     # Reusable UI components
│   ├── marketing/              # Nav, footer
│   └── dashboard/              # Sidebar
├── context/
│   └── auth-context.tsx        # Auth provider
├── lib/
│   ├── domain/
│   │   ├── entities.ts         # Core TypeScript types
│   │   └── auth.ts             # Auth provider interface
│   ├── repositories/
│   │   └── interfaces.ts       # Repository interfaces
│   ├── services/
│   │   └── checkout.ts         # Checkout service
│   ├── adapters/
│   │   ├── demo/               # localStorage-backed demo adapters
│   │   └── future/             # Placeholder files for Supabase/Stripe
│   ├── demo-data/
│   │   └── seed.ts             # All demo data
│   └── utils/
│       └── index.ts            # Utility functions
└── types/
```

## Connecting the Backend

See `NEXT_BACKEND_INTEGRATION_STEPS.md` for exact steps to connect:
1. Supabase Auth
2. Supabase Database
3. Supabase Storage
4. Stripe Checkout
5. Stripe Webhooks
6. Stripe Subscriptions
7. Resend Email

See `SELLI_ARCHITECTURE_PLAN.md` for the full architecture overview and how each layer plugs in.

## Environment Variables

Copy `.env.example` to `.env.local`. App runs in demo mode without any of these set.

```bash
cp .env.example .env.local
```

## Deploy to Netlify

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

The `netlify.toml` is pre-configured with `@netlify/plugin-nextjs`.

## Tech Stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS**
- **Recharts** (analytics charts)
- **Lucide React** (icons)
- **Sonner** (toast notifications)
- **localStorage** (demo persistence)

## Demo vs Production

| Feature | Demo | Production |
|---|---|---|
| Auth | localStorage | Supabase Auth |
| Database | localStorage | Supabase Postgres |
| Files | Mock | Supabase Storage |
| Payments | Simulated | Stripe |
| Emails | Logged | Resend |
| Payouts | UI only | Stripe Connect |
