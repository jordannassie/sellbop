import type { ProductIdea } from './types'
import { formatTrendingTraffic } from './scoring'

function formatPriceRange(minCents: number, maxCents: number): string {
  const min = Math.round(minCents / 100)
  const max = Math.round(maxCents / 100)
  return `$${min}-$${max}`
}

function trendContextBlock(idea: ProductIdea): string {
  const trend = idea.research?.trendResearch
  const isTrendBacked = idea.source === 'google_trends' || idea.source === 'google_trends_youtube'

  if (!isTrendBacked || !trend) {
    return 'No verified Google Trends data is attached to this idea.'
  }

  const lines = [
    `Trend query: ${trend.query}`,
    trend.trafficLabel ? `Trending search activity: ${formatTrendingTraffic(trend.trafficLabel)}` : null,
    trend.publishedAt ? `Detected: ${trend.publishedAt}` : null,
  ].filter(Boolean)

  return lines.join('\n')
}

function contentsBlock(idea: ProductIdea): string {
  if (idea.productContents.length === 0) return '- (none listed)'
  return idea.productContents.map(item => `- ${item}`).join('\n')
}

/** Build a Claude-ready prompt from Product Idea data — client-side only, no API calls. */
export function buildClaudePrompt(idea: ProductIdea): string {
  const price = formatPriceRange(idea.suggestedPriceMinCents, idea.suggestedPriceMaxCents)

  return `Create this digital product for my SellBop shop.

Product idea: ${idea.title}

Audience:
${idea.targetAudience}

Product format:
${idea.productType}

Suggested price:
${price}

Concept:
${idea.hook}

${idea.description ? `Description:\n${idea.description}\n\n` : ''}Trend/source context:
${trendContextBlock(idea)}
Do not invent trend data.

Suggested contents:
${contentsBlock(idea)}

Why this opportunity:
${idea.whyItCouldSell}

Build this into a high-quality sellable digital product.

Create:
1. Final product name
2. Strong positioning and promise
3. Complete outline
4. Full product content
5. Templates/checklists/workbook sections where appropriate
6. Product description
7. Suggested SellBop listing copy
8. Recommended cover/image direction
9. Suggested pricing
10. Affiliate-friendly promotional angles

Make the finished product useful, specific, practical, and worth paying for.`
}
