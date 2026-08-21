import 'server-only'

import { callOpenAiJson } from '../openai-client'
import { fetchSerpOrganic, isDataForSeoConfigured } from './dataforseo'
import type { CompetitorGapSignal } from './legacy-types'
import { UNAVAILABLE_COMPETITORS } from './legacy-types'

const RESULT_TYPES = [
  'article_blog',
  'youtube_video',
  'marketplace_product',
  'course',
  'pdf_guide',
  'software_tool',
  'forum_community',
  'major_brand',
  'other',
] as const

type ResultType = (typeof RESULT_TYPES)[number]

interface ClassifiedResult {
  index: number
  type: ResultType
}

function computeGapScore(
  digitalProduct: number,
  informational: number,
  marketplace: number,
  total: number,
): number {
  if (total === 0) return 0
  const infoRatio = informational / total
  const productRatio = (digitalProduct + marketplace) / total
  return Math.round(Math.min(100, infoRatio * 70 + (1 - productRatio) * 30))
}

function levelFromGapScore(score: number): CompetitorGapSignal['level'] {
  if (score >= 70) return 'large_gap'
  if (score >= 45) return 'some_gap'
  return 'crowded'
}

function summaryFromCounts(
  level: CompetitorGapSignal['level'],
  informational: number,
  digitalProduct: number,
): string {
  if (level === 'large_gap') {
    return 'Search demand exists while relatively few dedicated digital products appeared in sampled search results.'
  }
  if (level === 'some_gap') {
    return 'Some informational results dominate, with moderate competition from paid digital products.'
  }
  return `Sampled results include ${digitalProduct} dedicated product/course listings alongside informational content.`
}

export async function fetchCompetitorGapSignal(keyword: string): Promise<CompetitorGapSignal> {
  if (!isDataForSeoConfigured() || !keyword.trim()) {
    return { ...UNAVAILABLE_COMPETITORS }
  }

  try {
    const serp = await fetchSerpOrganic(keyword)
    if (serp.length === 0) return { ...UNAVAILABLE_COMPETITORS }

    const classification = await callOpenAiJson(
      `Classify search result types using ONLY the provided titles and URLs. Do not invent results. Types: ${RESULT_TYPES.join(', ')}. Return JSON: { "results": [{ "index": 0, "type": "article_blog" }] }`,
      JSON.stringify(serp.map((r, index) => ({ index, title: r.title, url: r.url, description: r.description })), null, 2),
    ) as { results?: ClassifiedResult[] }

    const types = new Map<number, ResultType>()
    for (const row of classification.results ?? []) {
      if (typeof row.index === 'number' && RESULT_TYPES.includes(row.type)) {
        types.set(row.index, row.type)
      }
    }

    let informational = 0
    let digitalProduct = 0
    let marketplace = 0

    serp.forEach((_, index) => {
      const type = types.get(index) ?? 'other'
      if (['article_blog', 'forum_community', 'youtube_video', 'other'].includes(type)) {
        informational++
      }
      if (['course', 'pdf_guide', 'software_tool'].includes(type)) {
        digitalProduct++
      }
      if (type === 'marketplace_product') {
        marketplace++
      }
    })

    const gapScore = computeGapScore(digitalProduct, informational, marketplace, serp.length)
    const level = levelFromGapScore(gapScore)

    return {
      available: true,
      digitalProductCompetitors: digitalProduct,
      informationalResults: informational,
      marketplaceResults: marketplace,
      gapScore,
      level,
      summary: summaryFromCounts(level, informational, digitalProduct + marketplace),
    }
  } catch (err) {
    console.error('[Competitors provider]', err)
    return { ...UNAVAILABLE_COMPETITORS }
  }
}
