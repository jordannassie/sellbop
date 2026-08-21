import 'server-only'

import { randomUUID } from 'crypto'
import {
  aiProductIdeasResponseSchema,
  type GenerateProductIdeasInput,
  type GenerateProductIdeasResult,
  type KeywordMetric,
  type ProductIdea,
  type ProductIdeaSource,
} from './types'
import { isDataForSeoConfigured, fetchKeywordMetrics } from './dataforseo'
import { calculateOpportunityScore } from './scoring'

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

async function callOpenAiJson(system: string, user: string): Promise<unknown> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_UNAVAILABLE')

  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    console.error('[Product Ideas] OpenAI error:', await response.text())
    throw new Error('OPENAI_FAILED')
  }

  const json = await response.json() as { choices?: { message?: { content?: string } }[] }
  const raw = json.choices?.[0]?.message?.content ?? '{}'
  return JSON.parse(raw)
}

export async function generateSeedKeywords(input: GenerateProductIdeasInput): Promise<string[]> {
  const topicLine = input.topic?.trim()
    ? `Optional focus topic: ${input.topic.trim()}`
    : 'No specific topic — explore the category broadly.'

  const result = await callOpenAiJson(
    'You create Google search seed phrases for digital product research. Return JSON only.',
    `Category: ${input.category}
${topicLine}

Create 6-10 search seed phrases that represent problems, questions, or buyer intent for sellable digital products in this category.
Use natural language people type into Google. Mix informational and commercial intent.

Return JSON: { "seeds": ["phrase 1", "phrase 2"] }`,
  ) as { seeds?: unknown }

  const seeds = Array.isArray(result.seeds)
    ? result.seeds.filter((s): s is string => typeof s === 'string' && s.trim().length > 2).map(s => s.trim())
    : []

  return [...new Set(seeds)].slice(0, 10)
}

function keywordBrief(metrics: KeywordMetric[]): string {
  return JSON.stringify(
    metrics.map(m => ({
      keyword: m.keyword,
      searchVolume: m.searchVolume,
      cpc: m.cpc,
      competition: m.competition,
      trend: m.trend,
    })),
    null,
    2,
  )
}

function attachMetrics(
  idea: ProductIdea,
  keywordMap: Map<string, KeywordMetric>,
  source: ProductIdeaSource,
): ProductIdea {
  if (source !== 'search_data' || !idea.primaryKeyword) return idea

  const metric = keywordMap.get(idea.primaryKeyword.toLowerCase())
  if (!metric) return { ...idea, source: 'ai_estimate', opportunityScore: null }

  const opportunityScore = calculateOpportunityScore({
    searchVolume: metric.searchVolume,
    cpc: metric.cpc,
    competition: metric.competition,
    trend: metric.trend,
  })

  return {
    ...idea,
    source: 'search_data',
    estimatedMonthlySearches: metric.searchVolume,
    cpc: metric.cpc,
    searchCompetition: metric.competition,
    trend: metric.trend,
    trendPercent: metric.trendPercent,
    opportunityScore,
  }
}

export async function generateProductIdeas(input: GenerateProductIdeasInput): Promise<GenerateProductIdeasResult> {
  const seeds = await generateSeedKeywords(input)
  let keywordMetrics: KeywordMetric[] = []
  let source: ProductIdeaSource = 'ai_estimate'
  let message: string | null = null

  if (isDataForSeoConfigured() && seeds.length > 0) {
    keywordMetrics = await fetchKeywordMetrics(seeds)
    if (keywordMetrics.length > 0) {
      source = 'search_data'
    } else {
      message = "Search data isn't available right now, so these ideas are AI-generated estimates."
    }
  } else if (!isDataForSeoConfigured()) {
    message = "Search data isn't configured, so these ideas are AI-generated estimates."
  } else {
    message = "Search data isn't available right now, so these ideas are AI-generated estimates."
  }

  const topKeywords = keywordMetrics.slice(0, Math.max(input.count, 8))
  const keywordMap = new Map(topKeywords.map(k => [k.keyword.toLowerCase(), k]))

  const topicLine = input.topic?.trim() ? `User topic focus: ${input.topic.trim()}` : 'No specific topic provided.'
  const dataBlock = source === 'search_data' && topKeywords.length > 0
    ? `Use these REAL keyword opportunities (do not invent search volumes):\n${keywordBrief(topKeywords)}`
    : 'No verified search metrics are available. Create strong product concepts without inventing search volume, CPC, or trend numbers.'

  const raw = await callOpenAiJson(
    `You are SellBop's product research assistant. Turn search opportunities into specific sellable digital product concepts for the SellBop marketplace. Avoid generic titles like "Fitness Ebook" or "Business Guide". Each concept needs a specific buyer, problem, outcome, and format. Return JSON only.`,
    `Category: ${input.category}
${topicLine}
${dataBlock}

Generate exactly ${input.count} digital product ideas.

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
      "primaryKeyword": "matching keyword phrase or null",
      "supportingKeywords": ["phrase"],
      "whyItCouldSell": "short explanation tied to the opportunity",
      "productContents": ["item 1", "item 2"]
    }
  ]
}`,
  )

  const parsed = aiProductIdeasResponseSchema.safeParse(raw)
  if (!parsed.success) {
    console.error('[Product Ideas] AI schema validation failed:', parsed.error.flatten())
    throw new Error('AI_MALFORMED')
  }

  const ideas: ProductIdea[] = parsed.data.ideas.slice(0, input.count).map(row => {
    const base: ProductIdea = {
      id: randomUUID(),
      title: row.title.trim(),
      hook: row.hook.trim(),
      description: row.description.trim(),
      targetAudience: row.targetAudience.trim(),
      category: row.category.trim(),
      productType: row.productType,
      suggestedPriceMinCents: row.suggestedPriceMinCents,
      suggestedPriceMaxCents: row.suggestedPriceMaxCents,
      primaryKeyword: row.primaryKeyword?.trim() ?? null,
      supportingKeywords: row.supportingKeywords.map(s => s.trim()).filter(Boolean),
      estimatedMonthlySearches: null,
      cpc: null,
      searchCompetition: null,
      trend: 'unknown',
      trendPercent: null,
      opportunityScore: null,
      source,
      whyItCouldSell: row.whyItCouldSell.trim(),
      productContents: row.productContents.map(s => s.trim()).filter(Boolean),
    }
    return attachMetrics(base, keywordMap, source)
  })

  return { ideas, source, message }
}
