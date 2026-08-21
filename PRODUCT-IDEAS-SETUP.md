# Product Ideas Setup

Product Ideas helps you find audience problems with demonstrated interest that can become sellable digital products.

**V1 uses free signals:** OpenAI for ideation, YouTube Data API for audience demand, public Google Trends matching, and query discovery. No paid keyword tools required.

## Provider overview

| Provider | What it adds | Required? |
|----------|--------------|-----------|
| OpenAI | Problem themes + product concepts + product-fit assessment | Yes (already used by AI Launch) |
| YouTube Data API | Video views, breakout ratios, creator validation | Recommended |
| Google Trends RSS | Bonus signal when a theme matches Trending Now | Automatic (free) |
| Query autocomplete | Related problem phrases | Automatic (free) |
| SellBop Data | Anonymized category commerce intelligence | Automatic when enough data exists |

DataForSEO and other paid search providers are **not required** and are not used in V1.

## 1. OpenAI API key

Product Ideas uses the same `OPENAI_API_KEY` as AI Launch.

If AI Launch already works on your site, you are set for the ideation layer.

## 2. YouTube Data API key (recommended)

YouTube is the primary V1 demand signal. Without it, Product Ideas still works in **AI Estimate** mode — but scores will not be backed by real audience data.

### Create a YouTube API key

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project (or select an existing one).
3. Open **APIs & Services → Library**.
4. Search for **YouTube Data API v3** and click **Enable**.
5. Go to **APIs & Services → Credentials**.
6. Click **Create credentials → API key**.
7. Copy the key. Optionally restrict it to **YouTube Data API v3** only.

## 3. Add Netlify environment variables

In your SellBop Netlify site → **Site configuration → Environment variables**, add:

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENAI_API_KEY` | Yes | Problem themes + product concepts |
| `YOUTUBE_API_KEY` | Recommended | Real YouTube audience demand research |

```env
OPENAI_API_KEY=
YOUTUBE_API_KEY=
```

Do **not** add DataForSEO credentials for V1.

## 4. Apply database migration 036

In the Supabase SQL Editor for your production project, paste and run:

`APPLY-036-IN-SUPABASE.sql`

Or locally, if you have `DATABASE_URL` set:

```bash
npm run db:apply-036
```

## 5. Redeploy

Push to `main` or run `netlify deploy --prod` so the new env vars and code are live.

## 6. Verify

1. Open `/dashboard/product-ideas` as a logged-in seller.
2. Choose a category and click **Find Product Ideas**.
3. With YouTube configured, cards should show **YouTube Data** and evidence chips like **YouTube Demand: Strong**.
4. Click **View Research** to see representative videos (not endorsements), related problems, and product opportunity details.
5. **Product Fit** is an AI assessment — clearly labeled, not measured search data.
6. No fake monthly search volumes, CPC, or search competition should appear.
7. Click **Build This Product with AI** — you should land on `/dashboard/ai-launch` with prefilled params.

## Cost notes

YouTube Data API has a free daily quota. SellBop clusters themes and caches results for 48 hours to stay within limits.
