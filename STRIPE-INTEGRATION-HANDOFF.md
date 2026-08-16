# Stripe Integration Handoff

This document gives a complete, step-by-step guide for a programmer to activate live Stripe payments in the Sellbop MVP. Every file path, function, database field, and environment variable is listed explicitly.

---

## Overview

The MVP checkout architecture is fully built. All server-side logic (product price retrieval, discount validation, fee calculation, order creation, purchase entitlements) is written and correct. The only missing piece is uncommenting the Stripe SDK calls and setting the environment variables.

Sellbop uses **Stripe Connect** to send seller payouts:

```
Customer pays → Stripe holds funds
→ Sellbop takes platform fee (application_fee_amount)
→ Stripe automatically transfers the remainder to the seller's connected Express account
```

---

## Required Stripe Products

- **Stripe Connect** (Express accounts) — for seller onboarding and payouts
- **Stripe Checkout** — hosted payment page for buyers
- **Stripe Webhooks** — event delivery to confirm payment and trigger order completion

---

## Step 1 — Environment Variables

Add these to `.env.local` (local) and your Netlify/production environment:

```env
# ── Stripe ───────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_...          # Server-only. Never expose publicly.
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...        # From Stripe Dashboard → Webhooks

# ── App URL (used for redirect URLs in Stripe sessions) ──────────────────────
NEXT_PUBLIC_APP_URL=https://www.sellbop.com

# ── Platform fee (default 5%) ────────────────────────────────────────────────
SELLBOP_PLATFORM_FEE_PERCENT=5
```

**These variables are already read by:**

- `src/lib/env.ts` — `env.stripe.secretKey`, `env.stripe.publishableKey`, `env.stripe.webhookSecret`
- `src/lib/platform-config.ts` — `SELLBOP_PLATFORM_FEE_PERCENT`

---

## Step 2 — Install the Stripe SDK

```bash
npm install stripe
```

---

## Step 3 — Stripe Connect Onboarding

### Button location

`src/app/dashboard/payouts/page.tsx` — "Connect Stripe" button calls:

```
POST /api/stripe/connect
```

### API route to activate

**File:** `src/app/api/stripe/connect/route.ts` — line 27–60

Uncomment the block marked `── STRIPE CONNECT ONBOARDING ──`. The full logic is already written:

1. Loads the seller's store from Supabase
2. Creates or retrieves the Express account via `stripe.accounts.create`
3. Saves `stripe_account_id` to the `stores` table
4. Creates an account link via `stripe.accountLinks.create`
5. Returns `{ onboarding_url }` to the client — redirect the seller to this URL

**Callback routes needed:**

| Purpose | Route to create |
|---|---|
| Onboarding return (success) | `GET /api/stripe/connect/return` |
| Onboarding refresh (expired link) | `GET /api/stripe/connect/refresh` |

Both routes should redirect sellers back to `/dashboard/payouts` and trigger a status refresh.

### Database fields (already in schema)

Table: `stores`

| Column | Type | Purpose |
|---|---|---|
| `stripe_account_id` | `text` | Stripe Express account ID (e.g. `acct_...`) |
| `stripe_onboarding_complete` | `boolean` | True after onboarding is finished |
| `stripe_charges_enabled` | `boolean` | True when account can accept charges |
| `stripe_payouts_enabled` | `boolean` | True when payouts are enabled |

Update these fields from the `account.updated` webhook event (see Step 5).

---

## Step 4 — Checkout Session Creation

### Flow

```
Buyer clicks "Buy" on /p/[slug]
→ POST /api/checkout/paid  (client sends: productSlug, buyerEmail, discountCode?)
→ Server loads product from DB (NEVER trusts client price)
→ Server validates discount server-side
→ Server creates Stripe Checkout Session
→ Returns { checkout_url }
→ Client redirects to Stripe hosted page
→ Buyer pays
→ Stripe fires webhook
```

### API route to activate

**File:** `src/app/api/checkout/paid/route.ts` — lines 98–136

Uncomment the block marked `── STRIPE CHECKOUT SESSION CREATION ──`.

Key values already calculated before that block:

| Variable | Description |
|---|---|
| `totalCents` | Final price after discount — use as `unit_amount` |
| `platformFeeCents` | Sellbop fee — use as `application_fee_amount` |
| `store.stripe_account_id` | Seller's Express account — use as `transfer_data.destination` |
| `discountCodeId` | Pass in `payment_intent_data.metadata` for webhook use |

**Success URL:**
```
${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}
```

**Cancel URL:**
```
${appUrl}/p/${productSlug}
```

### Metadata to pass (already in the commented code)

```javascript
metadata: {
  sellbop_product_id: product.id,
  sellbop_product_slug: productSlug,
  sellbop_store_id: store.id,
  buyer_email: buyerEmail,
  buyer_name: buyerName ?? '',
  discount_code_id: discountCodeId ?? '',
  discount_cents: discountCents,
}
```

The webhook handler reads all of these to create the order.

---

## Step 5 — Webhooks

### Register the webhook endpoint in Stripe Dashboard

```
https://www.sellbop.com/api/webhooks/stripe
```

Select these events:

- `checkout.session.completed`
- `payment_intent.payment_failed`
- `charge.refunded`
- `charge.dispute.created`
- `account.updated`

### API route to activate

**File:** `src/app/api/webhooks/stripe/route.ts` — lines 24–66

1. **Uncomment the signature verification block** (lines 24–33). This is critical — it prevents fake events.
2. **Uncomment the event switch block** (lines 36–65).

The `handleCheckoutCompleted` function (line 77) is **fully implemented** and handles:

- Idempotency check (prevents duplicate orders on retry)
- Creates `orders` row with all financial fields
- Creates `order_items` row
- Creates `purchases` entitlement row
- Increments discount code usage

For other events, add the logic noted in the comments:

| Event | Action |
|---|---|
| `payment_intent.payment_failed` | Update `orders.payment_status = 'failed'` |
| `charge.refunded` | Update `orders.payment_status = 'refunded'`, `orders.refund_status = 'refunded'`, set `purchases.status = 'revoked'` |
| `charge.dispute.created` | Update `orders.refund_status = 'disputed'` |
| `account.updated` | Update `stores.stripe_charges_enabled`, `stores.stripe_payouts_enabled`, `stores.stripe_onboarding_complete` |

---

## Step 6 — Platform Fee

**File:** `src/lib/platform-config.ts`

```typescript
export const SELLBOP_PLATFORM_FEE_PERCENT: number = parseFloat(
  process.env.SELLBOP_PLATFORM_FEE_PERCENT ?? '5'
)

export function calcPlatformFeeCents(totalCents: number): number {
  return Math.round(totalCents * (SELLBOP_PLATFORM_FEE_PERCENT / 100))
}
```

This value feeds directly into `application_fee_amount` in the Stripe Checkout Session (already wired in the commented code in `src/app/api/checkout/paid/route.ts`).

**To change the fee:** Set `SELLBOP_PLATFORM_FEE_PERCENT` in environment variables. No code changes needed.

---

## Step 7 — Refunds

**File:** `src/app/api/orders/[id]/route.ts` — POST handler (around line 60)

Currently returns a 503 placeholder. To activate:

```typescript
import Stripe from 'stripe'
const stripe = new Stripe(env.stripe.secretKey)

// Load order
const { data: order } = await admin.from('orders').select('*').eq('id', id).single()

// Refund via Stripe
await stripe.refunds.create({
  payment_intent: order.stripe_payment_intent_id,
  // amount: optional — omit for full refund
})

// Stripe fires charge.refunded webhook which updates the order
```

The `charge.refunded` webhook handler (Step 5) completes the flow by:

- Setting `orders.payment_status = 'refunded'`
- Setting `orders.refund_status = 'refunded'`
- Setting `purchases.status = 'revoked'` to revoke download access

---

## Step 8 — Success Page

**File:** `src/app/checkout/success/page.tsx`

The page reads `?session_id=` from the URL. After Stripe is connected, use this to retrieve the session and verify payment:

```typescript
const session = await stripe.checkout.sessions.retrieve(sessionId, {
  expand: ['line_items'],
})
if (session.payment_status !== 'paid') {
  // redirect to error
}
```

The page already renders the download button based on verified entitlement data. No UI changes needed.

---

## Step 9 — Testing Checklist (Stripe Test Mode)

Use `sk_test_...` keys and Stripe's test card `4242 4242 4242 4242`.

- [ ] Seller signs up and clicks "Connect Stripe" → redirects to Stripe Express onboarding
- [ ] Seller completes test onboarding → `stripe_account_id` saved in `stores` table
- [ ] Seller creates a paid product ($10)
- [ ] Buyer opens `/p/[slug]` → clicks Buy → enters email → redirected to Stripe Checkout
- [ ] Buyer uses test card → payment succeeds
- [ ] Stripe fires `checkout.session.completed` webhook
- [ ] Order created in `orders` table with `payment_status = 'paid'`
- [ ] Entitlement created in `purchases` table
- [ ] Buyer lands on `/checkout/success` → Download button visible
- [ ] Download API (`/api/download`) returns signed URL
- [ ] File downloads successfully
- [ ] Seller sees new sale in `/dashboard/sales`
- [ ] Test refund via Stripe Dashboard → `charge.refunded` webhook fires → `purchases.status = 'revoked'`
- [ ] Buyer download link no longer works after refund

---

## Database Tables Reference

### `stores` — Stripe Connect fields

```sql
stripe_account_id         TEXT
stripe_onboarding_complete BOOLEAN DEFAULT FALSE
stripe_charges_enabled    BOOLEAN DEFAULT FALSE
stripe_payouts_enabled    BOOLEAN DEFAULT FALSE
```

### `orders` — Payment fields

```sql
payment_status            TEXT  -- 'pending' | 'paid' | 'failed' | 'refunded' | 'disputed'
refund_status             TEXT  -- 'none' | 'pending' | 'refunded' | 'partial'
stripe_session_id         TEXT  -- Stripe Checkout Session ID
stripe_payment_intent_id  TEXT  -- For refunds
platform_fee_cents        INTEGER
currency                  TEXT DEFAULT 'usd'
product_title_snapshot    TEXT  -- Denormalized at purchase time
```

### `purchases` — Entitlement fields

```sql
status  TEXT  -- 'active' | 'revoked'
```

---

## Key File Reference

| Purpose | File |
|---|---|
| Platform fee config | `src/lib/platform-config.ts` |
| Environment variables | `src/lib/env.ts` |
| Checkout session creation | `src/app/api/checkout/paid/route.ts` |
| Stripe Connect onboarding | `src/app/api/stripe/connect/route.ts` |
| Webhook handler | `src/app/api/webhooks/stripe/route.ts` |
| Order creation logic | `src/app/api/webhooks/stripe/route.ts` → `handleCheckoutCompleted()` |
| Refund trigger | `src/app/api/orders/[id]/route.ts` |
| Secure download | `src/app/api/download/route.ts` |
| Connect Stripe button | `src/app/dashboard/payouts/page.tsx` |
| Success page | `src/app/checkout/success/page.tsx` |
| Database types | `src/lib/supabase/types.ts` |
| Migration | `supabase/migrations/009_mvp_sellbop.sql` |

---

## Tax / Legal Note

Sellbop is **not** currently set up as a Merchant of Record. Sellers receive payouts directly via Stripe Connect (Express). Each seller is responsible for their own tax obligations. Consult a tax professional before launching internationally or making claims about tax collection. This decision does not require any code changes to the MVP.
