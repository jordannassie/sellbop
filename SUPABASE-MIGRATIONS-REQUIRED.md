# Required Supabase SQL Migrations

**Netlify deployments do NOT auto-apply Supabase migrations.**

You must run each of these SQL files manually in the Supabase Dashboard:

👉 Go to: https://supabase.com/dashboard → your project → **SQL Editor**

Run the files below **in order**. Each file is idempotent (safe to re-run).

---

## Step 1 — Storage Buckets + Core Schema

Copy and paste the contents of each file into the SQL Editor and click **Run**:

1. `supabase/migrations/006_store_branding_and_storage.sql`
2. `supabase/migrations/009_mvp_sellbop.sql`
3. `supabase/migrations/010_affiliates_and_marketplace.sql`

---

## Required Storage Buckets

After running migration 006, these buckets must exist in **Storage**:

| Bucket | Public | Purpose |
|---|---|---|
| `product-images` | YES | Product cover images |
| `product-files` | NO | Private downloadable files |
| `store-images` | YES | Store/profile avatars |
| `store-banners` | YES | Store banners |

To verify: Dashboard → Storage → check each bucket exists.

If any are missing, run migration 006 again (it uses `ON CONFLICT DO NOTHING`).

---

## Environment Variables Required (Netlify)

Set these in Netlify → Site Settings → Environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://www.sellbop.com
ADMIN_ALLOWED_EMAILS=your@email.com
SELLBOP_PLATFORM_FEE_PERCENT=5
AFFILIATE_HOLD_DAYS=14
```

Optional (for email):
```
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@sellbop.com
```

Stripe (when ready — see STRIPE-INTEGRATION-HANDOFF.md):
```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```
