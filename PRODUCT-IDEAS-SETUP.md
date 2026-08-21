# Product Ideas Setup

Product Ideas scans **Google Trends Trending Now** (free RSS) and uses OpenAI to turn useful demand signals into digital product concepts.

## Required

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Trend interpretation + product concepts (same as AI Launch) |

## Optional

| Variable | Purpose |
|----------|---------|
| `YOUTUBE_API_KEY` | Future optional validation — **not required** for Find Product Ideas |

**No DataForSEO, Google Cloud Trends API, or OAuth required for V1.**

## How it works

1. SellBop fetches the public US Google Trends RSS feed once per request (cached ~10 min server-side).
2. OpenAI filters trends with real product potential for your category/topic.
3. Verified trend metrics (traffic label, detected time) are attached server-side — never invented by AI.
4. If no good trends match, remaining slots are honest **AI Estimate** ideas.

## Saved Ideas (migration 036)

Save/Delete requires migration 036 in Supabase. **Finding ideas does not require the database.**

Run `APPLY-036-IN-SUPABASE.sql` in the Supabase SQL Editor if Save is not working yet.

## Verify

1. Open `/dashboard/product-ideas`
2. Choose a category, optionally add a topic
3. Click **Find Product Ideas**
4. Trend-backed cards show **Google Trends**, **Trending Now**, and traffic like `20K+ trending searches`
5. AI-only cards show **AI Estimate** with no fake trend data
