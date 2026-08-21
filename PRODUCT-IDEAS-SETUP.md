# Product Ideas Setup

Product Ideas uses OpenAI for research and optionally DataForSEO for real estimated search demand.

## 1. Create a DataForSEO account

Sign up at [https://dataforseo.com](https://dataforseo.com) and note your API login and password.

## 2. Add Netlify environment variables

In your SellBop Netlify site → **Site configuration → Environment variables**, add:

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENAI_API_KEY` | Yes | Seed keywords + product concept generation |
| `DATAFORSEO_LOGIN` | Optional | Real Google Ads keyword data |
| `DATAFORSEO_PASSWORD` | Optional | Real Google Ads keyword data |

Without DataForSEO, Product Ideas still works in **AI Estimate** mode (no fabricated search volumes).

## 3. Apply database migration 036

In the Supabase SQL Editor for your production project, paste and run:

`APPLY-036-IN-SUPABASE.sql`

Or locally, if you have `DATABASE_URL` set:

```bash
npm run db:apply-036
```

## 4. Redeploy

Push to `main` or run `netlify deploy --prod` so the new env vars and code are live.

## 5. Verify

1. Open `/dashboard/product-ideas` as a logged-in seller.
2. Choose a category and click **Find Product Ideas**.
3. With DataForSEO configured, cards should show **Search Data** badges and estimated monthly searches.
4. Without DataForSEO, cards show **AI Estimate** and no fake volume numbers.
5. Click **Build This Product with AI** — you should land on `/dashboard/ai-launch` with `idea`, `audience`, and `priceRange` prefilled.
