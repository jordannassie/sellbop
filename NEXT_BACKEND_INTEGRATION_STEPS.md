# Next Backend Integration Steps

Follow this order when connecting real backend services. Each step is independent — go as far as you want, as fast as you want.

---

## Step 1 — Supabase Auth

**Goal:** Replace demo localStorage sessions with real Supabase auth.

```bash
npm install @supabase/ssr @supabase/supabase-js
```

1. Create a Supabase project at supabase.com
2. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
3. Create `src/lib/adapters/supabase/auth.ts` implementing `IAuthProvider`
4. In `src/context/auth-context.tsx`, replace `demoAuth` with `supabaseAuth`
5. Add middleware (`src/middleware.ts`) using `@supabase/ssr` to refresh sessions server-side
6. Done — all protected routes now use real Supabase sessions

---

## Step 2 — Supabase Database

**Goal:** Replace localStorage repositories with Supabase tables.

### Schema (SQL)

```sql
-- Run in Supabase SQL Editor
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  slug text unique not null,
  display_name text not null,
  brand_name text,
  bio text,
  support_email text not null,
  plan text default 'free',
  created_at timestamptz default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references profiles(id) not null,
  name text not null,
  slug text unique not null,
  description text,
  product_type text not null,
  status text default 'draft',
  price integer not null,
  compare_at_price integer,
  currency text default 'usd',
  file_asset_ids text[],
  external_url text,
  cta_text text default 'Buy Now',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references profiles(id),
  product_id uuid references products(id),
  customer_email text not null,
  amount integer not null,
  currency text default 'usd',
  status text default 'pending',
  payment_status text default 'unpaid',
  stripe_session_id text,
  created_at timestamptz default now()
);

create table downloads (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id),
  token text unique not null,
  file_path text not null,
  download_count integer default 0,
  max_downloads integer,
  expires_at timestamptz,
  created_at timestamptz default now()
);
```

### RLS Policies

```sql
alter table products enable row level security;
create policy "Sellers can CRUD their own products"
  on products for all using (seller_id = auth.uid());

create policy "Anyone can read published products"
  on products for select using (status = 'published');
```

2. Create `src/lib/adapters/supabase/repositories.ts` implementing each `IXxxRepository`
3. Swap the imports in service files and page components
4. Done — data now lives in Postgres

---

## Step 3 — Supabase Storage

**Goal:** Real file uploads and secure download delivery.

1. Create two buckets in Supabase:
   - `product-files` (private)
   - `product-thumbnails` (public)
2. Update file upload UI to call:
   ```typescript
   await supabase.storage.from('product-files').upload(path, file)
   ```
3. For downloads, generate a signed URL:
   ```typescript
   const { data } = await supabase.storage.from('product-files')
     .createSignedUrl(path, 3600)
   return redirect(data.signedUrl)
   ```
4. Create `/app/api/download/[token]/route.ts` that validates the token from the `downloads` table, then generates a signed URL

---

## Step 4 — Stripe Checkout

**Goal:** Real payments for product purchases.

```bash
npm install stripe
```

1. Add to `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
2. For each product, store a `stripe_price_id` in the products table
3. Create `/app/api/checkout/route.ts`:
   ```typescript
   const session = await stripe.checkout.sessions.create({
     mode: productType === 'subscription' ? 'subscription' : 'payment',
     line_items: [{ price: product.stripePriceId, quantity: 1 }],
     success_url: `${APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
     cancel_url: `${APP_URL}/checkout/cancel`,
   })
   return Response.json({ url: session.url })
   ```
4. Update `BuyButton` to call `/api/checkout` and redirect to `session.url`

---

## Step 5 — Stripe Webhooks

**Goal:** Reliably update orders and grants after payment.

1. Create `/app/api/webhooks/stripe/route.ts`
2. Verify signature: `stripe.webhooks.constructEvent(body, sig, secret)`
3. Handle these events:
   - `checkout.session.completed` → create Order + DownloadGrant + send receipt
   - `customer.subscription.updated` → update Subscription status
   - `customer.subscription.deleted` → cancel Subscription
   - `invoice.payment_failed` → log failed payment
4. In Stripe Dashboard → Webhooks, add your endpoint URL

---

## Step 6 — Stripe Subscriptions

**Goal:** Real recurring billing for your own Shopzely plans.

1. Create Starter ($19/mo) and Pro ($49/mo) products in Stripe
2. Add price IDs to `.env.local`:
   ```
   STRIPE_STARTER_PRICE_ID=price_xxx
   STRIPE_PRO_PRICE_ID=price_xxx
   ```
3. Create `/app/api/billing/subscribe/route.ts` to start Stripe Checkout for plan upgrades
4. Create `/app/api/billing/portal/route.ts` to open Stripe Customer Portal
5. Webhook handles `customer.subscription.updated` → updates seller `plan` in profiles table

---

## Step 7 — Email with Resend

**Goal:** Real transactional emails.

```bash
npm install resend
```

1. Sign up at resend.com, get API key
2. Add `RESEND_API_KEY` to `.env.local`
3. Create `src/lib/adapters/resend/email.ts` implementing an email interface:
   ```typescript
   await resend.emails.send({
     from: 'Shopzely <noreply@yourdomain.com>',
     to: buyerEmail,
     subject: `Your receipt — ${productName}`,
     html: receiptTemplate(order),
   })
   ```
4. Replace simulated email logs with real sends in the checkout service
5. Set up custom domain in Resend for deliverability

---

## Priority Order

For fastest path to live:

1. ✅ Supabase Auth (users can actually sign up)
2. ✅ Stripe Checkout (real payments)
3. ✅ Stripe Webhooks (order records created)
4. ✅ Supabase Database (products/orders persist)
5. ✅ Supabase Storage (file delivery works)
6. ✅ Stripe Subscriptions (Shopzely billing)
7. ✅ Email (Resend receipts)
8. ✅ Stripe Connect (seller payouts)
