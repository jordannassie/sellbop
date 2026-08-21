import 'server-only'

import { randomUUID } from 'crypto'
import {
  aiProductIdeasResponseSchema,
  type GenerateProductIdeasInput,
  type GenerateProductIdeasResult,
  type ProductIdea,
  type ResearchTheme,
} from './types'
import { callOpenAiJson } from './openai-client'
import { isYouTubeConfigured } from './providers/youtube'
import {
  buildResearchBrief,
  calculateCombinedOpportunityScore,
  resolveIdeaSource,
} from './opportunity-engine'
import {
  findBestThemeMatch,
  researchThemes,
} from './research'

export async function generateResearchThemes(input: GenerateProductIdeasInput): Promise<ResearchTheme[]> {
  const topicLine = input.topic?.trim()
    ? `Optional focus topic: ${input.topic.trim()}`
    : 'No specific topic — explore the category broadly.'

  const result = await callOpenAiJson(
    'You identify strong audience problems that could become sellable digital products. Return JSON only.',
    `Category: ${input.category}
${topicLine}

Create 3-5 problem themes — practical struggles, questions, or workflows people actively seek help with.
Each theme should be specific enough to research on YouTube (not generic category names).

Return JSON:
{
  "themes": [
    {
      "theme": "how to get more real estate listing appointments",
      "seedQueries": ["listing appointment scripts", "seller prospecting real estate"]
    }
  ]
}`,
  ) as { themes?: { theme?: string; seedQueries?: unknown }[] }

  const themes: ResearchTheme[] = []
  for (const row of result.themes ?? []) {
    if (typeof row.theme !== 'string' || row.theme.trim().length < 5) continue
    const seedQueries = Array.isArray(row.seedQueries)
      ? row.seedQueries.filter((s): s is string => typeof s === 'string').map(s => s.trim()).filter(Boolean)
      : []
    themes.push({ theme: row.theme.trim(), seedQueries })
  }

  return themes.slice(0, 5)
}

function themesBrief(themeMap: Awaited<ReturnType<typeof researchThemes>>): string {
  const lines: string[] = []
  for (const bundle of themeMap.values()) {
    const research = {
      theme: bundle.theme,
      queries: bundle.queries,
      youtube: bundle.youtube,
      trends: bundle.trends,
      productFit: bundle.productFit,
      sellbop: bundle.sellbop,
    }
    lines.push(buildResearchBrief(research))
  }
  return lines.join('\n\n')
}

export async function generateProductIdeas(input: GenerateProductIdeasInput): Promise<GenerateProductIdeasResult> {
  const themes = await generateResearchThemes(input)
  let message: string | null = null

  if (!isYouTubeConfigured()) {
    message = 'YouTube research is not configured. Ideas are AI-generated estimates without validated audience data. Add YOUTUBE_API_KEY for real demand signals.'
  }

  const themeMap = themes.length > 0
    ? await researchThemes(themes, { category: input.category, topic: input.topic })
    : new Map()

  const hasYouTubeData = [...themeMap.values()].some(b => b.youtube.available)
  if (isYouTubeConfigured() && !hasYouTubeData && themeMap.size > 0) {
    message = message ?? 'Limited YouTube evidence was found for these themes. Scores may reflect AI assessment only.'
  }

  const topicLine = input.topic?.trim() ? `User topic focus: ${input.topic.trim()}` : 'No specific topic provided.'
  const researchBlock = themeMap.size > 0
    ? `\n\nVerified research (use ONLY this evidence in whyItCouldSell — never invent view counts, search volumes, or competitor claims):\n${themesBrief(themeMap)}

Researched themes (assign each idea a primaryKeyword matching one theme):
${[...themeMap.keys()].map(t => `- ${t}`).join('\n')}`
    : '\n\nNo verified YouTube research available. Create strong product concepts without inventing metrics.'

  const raw = await callOpenAiJson(
    `You are SellBop's product research assistant. Turn audience problems into specific sellable digital product concepts. Avoid generic titles. Each concept needs a specific buyer, problem, outcome, and format.

When YouTube evidence exists, explain whyItCouldSell using ONLY verified evidence in 2-4 sentences — mention breakout videos or cross-creator interest when supported by data.

Product Fit reasoning may reference AI assessment but must not claim low competition.

Return JSON only.`,
    `Category: ${input.category}
${topicLine}${researchBlock}

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
      "primaryKeyword": "matching researched theme phrase",
      "supportingKeywords": ["related problem query"],
      "whyItCouldSell": "evidence-based explanation",
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
    const research = findBestThemeMatch(
      themeMap,
      row.primaryKeyword?.trim() ?? null,
      row.supportingKeywords.map(s => s.trim()).filter(Boolean),
    )

    const opportunityScore = research ? calculateCombinedOpportunityScore(research) : null
    const source = resolveIdeaSource(research)

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
      primaryKeyword: row.primaryKeyword?.trim() ?? null,
      supportingKeywords: row.supportingKeywords.map(s => s.trim()).filter(Boolean),
      estimatedMonthlySearches: null,
      cpc: null,
      searchCompetition: null,
      trend: 'unknown',
      trendPercent: null,
      opportunityScore,
      source,
      whyItCouldSell: row.whyItCouldSell.trim(),
      productContents: row.productContents.map(s => s.trim()).filter(Boolean),
      research,
    }
  })

  return {
    ideas,
    source: ideas.some(i => i.source === 'youtube_data') ? 'youtube_data' : 'ai_estimate',
    message,
  }
}
