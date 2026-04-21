# Shopzely v2 Architecture Plan

## Current Demo Architecture

The app runs in **fully client-side demo mode** using localStorage as the backing store and static seed data as fallback.

```
User Browser
├── React / Next.js (App Router)
├── AuthProvider (context/auth-context.tsx)
│   └── DemoAuthAdapter (lib/adapters/demo/auth.ts)
│       └── localStorage: shopzely_demo_session
├── Demo Repositories (lib/adapters/demo/repositories.ts)
│   └── Each repo: localStorage key → seed fallback → in-memory writes
├── Service Layer (lib/services/)
│   └── Stateless business logic: checkout, analytics, email
└── UI Layer (components/, app/)
    └── All pages hydrate from demo repos
```

### Demo Data Flow

1. Page renders → calls `demoXxxRepo.findXxx()`
2. Repo checks `localStorage['shopzely_demo_xxx']`
3. If empty → returns `DEMO_XXX` seed constants
4. Writes (`create`, `update`) persist to `localStorage`
5. Data survives page refreshes; reset via `/internal/demo-center`

### Key Demo Constraints

- All data is **per-browser, not shared**
- No real money moves — checkout simulates payment
- No real emails sent — logged as `simulated` in EmailLog
- File uploads show UI but don't actually upload

---

## How Supabase Plugs In

### 1. Auth

Replace `DemoAuthAdapter` with `SupabaseAuthAdapter`:

```typescript
// lib/adapters/supabase/auth.ts
import { createBrowserClient } from '@supabase/ssr'
class SupabaseAuthAdapter implements IAuthProvider {
  async signIn(email, password) {
    const supabase = createBrowserClient(...)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    return { userId: data.user.id, email: data.user.email, ... }
  }
  // ... signUp, signOut, getSession
}
```

In `context/auth-context.tsx`, swap:
```typescript
// Before: import { demoAuth } from '@/lib/adapters/demo/auth'
// After:  import { supabaseAuth } from '@/lib/adapters/supabase/auth'
```

### 2. Database (Repositories)

For each entity, create a `SupabaseXxxRepository` that implements `IXxxRepository`:

```typescript
// lib/adapters/supabase/product-repository.ts
class SupabaseProductRepository implements IProductRepository {
  async findAll(sellerId: string) {
    const { data } = await supabase.from('products').select('*').eq('seller_id', sellerId)
    return data ?? []
  }
  // ...
}
```

Table naming convention: snake_case (`seller_id`, `product_type`, etc.)

### 3. Storage (File Assets)

Replace demo file upload placeholder with Supabase Storage:

```typescript
// Bucket: 'product-files' (private)
const { data } = await supabase.storage.from('product-files')
  .upload(`${sellerId}/${file.name}`, file)

// Signed URL for downloads:
const { data: url } = await supabase.storage.from('product-files')
  .createSignedUrl(path, 3600) // 1 hour expiry
```

---

## How Stripe Plugs In

### 1. Checkout

Create `/app/api/checkout/route.ts`:

```typescript
export async function POST(req: Request) {
  const { productId, buyerEmail, couponCode } = await req.json()
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: buyerEmail,
    line_items: [{ price: product.stripePriceId, quantity: 1 }],
    mode: product.productType === 'subscription' ? 'subscription' : 'payment',
    success_url: `${APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/checkout/cancel`,
    discounts: couponCode ? [{ coupon: stripeCouponId }] : [],
  })
  return Response.json({ url: session.url })
}
```

### 2. Webhooks

Create `/app/api/webhooks/stripe/route.ts` to handle:
- `checkout.session.completed` → create Order, DownloadGrant, send receipt
- `customer.subscription.updated/deleted` → update Subscription record
- `invoice.payment_failed` → notify seller/buyer

### 3. Billing Portal (Shopzely's own plans)

```typescript
const session = await stripe.billingPortal.sessions.create({
  customer: sellerStripeCustomerId,
  return_url: `${APP_URL}/dashboard/billing`,
})
return redirect(session.url)
```

---

## What Is Demo-Only vs Production-Ready

| Layer | Demo | Production |
|---|---|---|
| Auth | localStorage session | Supabase Auth |
| Database | localStorage + seed | Supabase PostgreSQL |
| File Storage | Mock assets | Supabase Storage |
| Payments | Simulated | Stripe Checkout |
| Subscriptions | Simulated | Stripe Subscriptions |
| Payouts | Placeholder UI | Stripe Connect |
| Emails | EmailLog records | Resend API |
| Analytics | In-memory events | Supabase or PostHog |
| Download URLs | Alert placeholder | Supabase signed URLs |

### Production-Ready Right Now

- Domain entities and interfaces ✓
- Repository interfaces ✓
- Service layer logic ✓
- UI components ✓
- All routes and pages ✓
- Checkout flow structure ✓
- Order/download lifecycle ✓
- Auth provider pattern ✓

Everything is designed to swap the adapter, not rewrite the app.
