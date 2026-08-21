import 'server-only'

import { randomUUID } from 'crypto'
import {
  aiTrendIdeasResponseSchema,
  type GenerateProductIdeasInput,
  type GenerateProductIdeasResult,
  type ProductIdea,
  productFitLabel,
} from './types'
import { callOpenAiJson } from './openai-client'
import { fetchGoogleTrendsFeed } from './providers/google-trends'
import {
  aiOpportunityEstimate,
  calculateGoogleTrendsOpportunityScore,
  findVerifiedTrendItem,
  googleTrendExploreUrl,
  GOOGLE_TRENDS_PAGE_URL,
  type GoogleTrendItem,
} from './google-trends-parser'
import type { ProductIdeasLogger } from './logger'

function trendsForOpenAi(items: GoogleTrendItem[]): unknown[] {
  return items.slice(0, 45).map(item => ({
    query: item.query,
    trafficLabel: item.trafficLabel,
    publishedAt: item.publishedAt,
    relatedTitles: item.relatedTitles.slice(0, 2),
  }))
}

function buildOpenAiPrompt(
  input: GenerateProductIdeasInput,
  trends: GoogleTrendItem[],
  trendsAvailable: boolean,
): { system: string; user: string } {
  const topicLine = input.topic?.trim()
    ? `User topic/problem focus: ${input.topic.trim()}`
    : 'No specific topic — use category context and current trends.'

  const trendsBlock = trendsAvailable && trends.length > 0
    ? `CURRENT GOOGLE TRENDS (Trending Now, US — REAL DATA, reference by exact query only):
${JSON.stringify(trendsForOpenAi(trends), null, 2)}

Rules for google_trends ideas:
- source must be "google_trends"
- sourceTrendQuery MUST exactly match a query from the list above
- Reject news-only spikes (celebrity, sports scores, deaths, politics, one-time emergencies)
- Prefer problems that become guides, toolkits, templates, workbooks, checklists, planners, courses
- Score productFitScore and evergreenScore 0-100
- Do NOT invent traffic labels or search volumes`
    : `Google Trends feed is unavailable. Return all ideas as source "ai_estimate" with sourceTrendQuery null.`

  return {
    system: `You are SellBop's product research assistant. Turn REAL Google Trends interest into sellable digital product concepts.

You may interpret trends but must NOT invent Google Trends data. For google_trends ideas, sourceTrendQuery must match a provided query exactly.

Filter out low product potential: breaking news, celebrity gossip, sports scores, political events, random names.

Return JSON only with exactly ${input.count} ideas.`,
    user: `Category: ${input.category}
${topicLine}

${trendsBlock}

Generate exactly ${input.count} digital product ideas. Prefer google_trends when a real trend fits. Fill remaining slots with ai_estimate evergreen ideas if needed.

Return JSON:
{
  "ideas": [
    {
      "title": "specific product name",
      "hook": "1-2 sentence hook",
      "description": "2-3 sentences",
      "targetAudience": "specific buyer",
      "category": "${input.category}",
      "productType": "Guide|Workbook|Template|Toolkit|Course|Checklist|Spreadsheet|Notion Template|Bundle|Other",
      "suggestedPriceMinCents": 2700,
      "suggestedPriceMaxCents": 6700,
      "source": "google_trends|ai_estimate",
      "sourceTrendQuery": "exact trend query or null",
      "productFitScore": 82,
      "evergreenScore": 75,
      "primaryKeyword": "problem phrase",
      "supportingKeywords": ["related phrase"],
      "whyItCouldSell": "2-4 sentences referencing verified trend activity when google_trends",
      "productContents": ["item 1", "item 2"]
    }
  ]
}`,
  }
}

function mergeIdea(
  row: ReturnType<typeof aiTrendIdeasResponseSchema.parse>['ideas'][number],
  verifiedTrends: GoogleTrendItem[],
): ProductIdea {
  let source: ProductIdea['source'] = row.source
  let verified: GoogleTrendItem | null = null

  if (source === 'google_trends') {
    verified = findVerifiedTrendItem(verifiedTrends, row.sourceTrendQuery ?? null)
    if (!verified) source = 'ai_estimate'
  }

  const productFitScore = row.productFitScore
  const evergreenScore = row.evergreenScore

  let opportunityScore: number | null = null
  let aiEstimate: number | null = null
  let research: ProductIdea['research']

  if (source === 'google_trends' && verified) {
    opportunityScore = calculateGoogleTrendsOpportunityScore({
      trafficApprox: verified.trafficApprox,
      publishedAt: verified.publishedAt,
      productFitScore,
      evergreenScore,
    })
    research = {
      trendResearch: {
        query: verified.query,
        trafficLabel: verified.trafficLabel,
        trafficApprox: verified.trafficApprox,
        publishedAt: verified.publishedAt,
        sourceUrl: GOOGLE_TRENDS_PAGE_URL,
        exploreUrl: googleTrendExploreUrl(verified.query),
        relatedTitles: verified.relatedTitles,
      },
      productFitScore,
      evergreenScore,
      productFitReason: `Product Fit: ${productFitLabel(productFitScore)}`,
      whyProductAngle: row.whyItCouldSell,
    }
  } else {
    aiEstimate = aiOpportunityEstimate({ productFitScore, evergreenScore })
    research = {
      productFitScore,
      evergreenScore,
      productFitReason: `Product Fit: ${productFitLabel(productFitScore)}`,
      whyProductAngle: row.whyItCouldSell,
    }
  }

  return {
    id: randomUUID(),
    title: row.title.trim(),
    hook: row.hook.trim(),
    description: row.description.trim(),
    targetAudience: row.targetAudience.trim(),
    category: row.category.trim(),
    productType: row.productType,
    suggestedPriceMinCents: row.suggestedPriceMinCents,
    suggestedPriceMaxCents: row.suggestedPriceMaxCents,
    primaryKeyword: row.sourceTrendQuery?.trim() ?? row.primaryKeyword?.trim() ?? null,
    supportingKeywords: row.supportingKeywords.map(s => s.trim()).filter(Boolean),
    estimatedMonthlySearches: null,
    cpc: null,
    searchCompetition: null,
    trend: 'unknown',
    trendPercent: null,
    opportunityScore,
    aiOpportunityEstimate: aiEstimate,
    source,
    whyItCouldSell: row.whyItCouldSell.trim(),
    productContents: row.productContents.map(s => s.trim()).filter(Boolean),
    research,
  }
}

export async function generateProductIdeas(
  input: GenerateProductIdeasInput,
  log: ProductIdeasLogger,
): Promise<GenerateProductIdeasResult> {
  const started = Date.now()
  log.info('started')

  const trendsFeed = await fetchGoogleTrendsFeed(log)
  const trends = trendsFeed.items

  let message: string | null = null
  if (!trendsFeed.available) {
    message = "Google Trends data isn't available right now, so these ideas are AI-generated estimates."
    log.info(`google-trends unavailable: ${trendsFeed.error ?? 'unknown'}`)
  }

  const { system, user } = buildOpenAiPrompt(input, trends, trendsFeed.available)

  const raw = await log.timed('openai', () => callOpenAiJson(system, user))

  const parsed = aiTrendIdeasResponseSchema.safeParse(raw)
  if (!parsed.success) {
    log.error('openai schema validation failed', parsed.error.flatten())
    throw new Error('AI_MALFORMED')
  }

  const ideas = parsed.data.ideas.slice(0, input.count).map(row => mergeIdea(row, trends))

  log.info(`total ${Date.now() - started}ms success (${ideas.filter(i => i.source === 'google_trends').length} trend-backed)`)

  return {
    ok: true,
    ideas,
    message,
    trendingNow: trends.slice(0, 8),
    requestId: log.requestId,
  }
}
