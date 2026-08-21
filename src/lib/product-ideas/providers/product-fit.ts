import 'server-only'

import { callOpenAiJson } from '../openai-client'
import type { ProductFitLevel, ProductFitSignal, YouTubeSignal } from '../types'
import { UNAVAILABLE_PRODUCT_FIT } from '../types'

const FIT_LEVELS: ProductFitLevel[] = ['very_strong', 'strong', 'moderate', 'weak']

function fitScoreFromLevel(level: ProductFitLevel): number | null {
  switch (level) {
    case 'very_strong': return 95
    case 'strong': return 78
    case 'moderate': return 58
    case 'weak': return 30
    default: return null
  }
}

function youtubeBrief(youtube: YouTubeSignal | undefined): string {
  if (!youtube?.available) return 'No YouTube evidence available.'
  return [
    `${youtube.relevantVideoCount} relevant videos`,
    youtube.breakoutVideoCount > 0 ? `${youtube.breakoutVideoCount} breakout videos (views/subscribers ≥ 3x)` : null,
    youtube.youtubeDemandScore != null ? `YouTube demand score ${youtube.youtubeDemandScore}` : null,
    youtube.examples.slice(0, 3).map(v => `"${v.title}" (${v.views?.toLocaleString() ?? '?'} views)`).join('; '),
  ].filter(Boolean).join('. ')
}

/** AI assessment of whether a problem can become a paid digital product — not competitor research. */
export async function assessProductFit(
  theme: string,
  category: string,
  youtube: YouTubeSignal | undefined,
): Promise<ProductFitSignal> {
  if (!theme.trim()) return { ...UNAVAILABLE_PRODUCT_FIT }

  try {
    const result = await callOpenAiJson(
      `You assess whether an audience problem can become a useful paid digital product (guide, template, toolkit, workbook, checklist, course). You must NOT claim low competition or few competitors unless given real competitor data — we have none. Focus on product packaging fit only. Return JSON: { "level": "very_strong|strong|moderate|weak", "reason": "1-2 sentences" }`,
      `Category: ${category}
Problem theme: ${theme}

YouTube audience evidence (if any): ${youtubeBrief(youtube)}

Assess Product Fit — can this problem reasonably become a sellable digital product?`,
    ) as { level?: string; reason?: string }

    const level = FIT_LEVELS.includes(result.level as ProductFitLevel)
      ? result.level as ProductFitLevel
      : 'moderate'

    return {
      available: true,
      level,
      fitScore: fitScoreFromLevel(level),
      reason: typeof result.reason === 'string' ? result.reason.trim() : null,
    }
  } catch (err) {
    console.error('[Product Fit]', err)
    return { ...UNAVAILABLE_PRODUCT_FIT }
  }
}

function signalFromResult(result: { level?: string; reason?: string }): ProductFitSignal {
  const level = FIT_LEVELS.includes(result.level as ProductFitLevel)
    ? result.level as ProductFitLevel
    : 'moderate'

  return {
    available: true,
    level,
    fitScore: fitScoreFromLevel(level),
    reason: typeof result.reason === 'string' ? result.reason.trim() : null,
  }
}

/** Batch product-fit assessment in one OpenAI call to reduce latency. */
export async function assessProductFitBatch(
  items: { theme: string; youtube: YouTubeSignal | undefined }[],
  category: string,
): Promise<Map<string, ProductFitSignal>> {
  const map = new Map<string, ProductFitSignal>()
  if (items.length === 0) return map

  if (items.length === 1) {
    const fit = await assessProductFit(items[0].theme, category, items[0].youtube)
    map.set(items[0].theme.toLowerCase(), fit)
    return map
  }

  try {
    const payload = items.map(i => ({
      theme: i.theme,
      youtubeEvidence: youtubeBrief(i.youtube),
    }))

    const result = await callOpenAiJson(
      `You assess whether audience problems can become useful paid digital products. Do NOT claim low competition. Return JSON: { "assessments": [{ "theme": "exact theme string", "level": "very_strong|strong|moderate|weak", "reason": "1-2 sentences" }] }`,
      `Category: ${category}

Assess each theme:
${JSON.stringify(payload, null, 2)}`,
    ) as { assessments?: { theme?: string; level?: string; reason?: string }[] }

    for (const row of result.assessments ?? []) {
      if (typeof row.theme !== 'string') continue
      map.set(row.theme.toLowerCase(), signalFromResult(row))
    }

    for (const item of items) {
      const key = item.theme.toLowerCase()
      if (!map.has(key)) {
        map.set(key, signalFromResult({ level: 'moderate' }))
      }
    }

    return map
  } catch (err) {
    console.error('[Product Fit batch]', err)
    for (const item of items) {
      map.set(item.theme.toLowerCase(), { ...UNAVAILABLE_PRODUCT_FIT })
    }
    return map
  }
}
