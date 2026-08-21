import 'server-only'

import type { ThemeResearchBundle, ProviderContext } from './providers/types'
import { discoverRelatedQueries, queriesForTheme } from './providers/query-discovery'
import { fetchGoogleTrendsSignal } from './providers/google-trends'
import { fetchYouTubeSignal } from './providers/youtube'
import { assessProductFit } from './providers/product-fit'
import { fetchSellBopSignal } from './providers/sellbop'
import type { ProductIdeaResearch, ResearchTheme } from './types'
import {
  UNAVAILABLE_PRODUCT_FIT,
  UNAVAILABLE_SELLBOP,
  UNAVAILABLE_TRENDS,
  UNAVAILABLE_YOUTUBE,
} from './types'

const MAX_RESEARCH_THEMES = 5

async function researchTheme(
  theme: ResearchTheme,
  allQueries: Awaited<ReturnType<typeof discoverRelatedQueries>>,
  sellbop: Awaited<ReturnType<typeof fetchSellBopSignal>>,
  ctx: ProviderContext,
): Promise<ThemeResearchBundle> {
  const queries = queriesForTheme(allQueries, theme.theme, theme.seedQueries)

  const youtube = await fetchYouTubeSignal(theme.theme)
  const [trends, productFit] = await Promise.all([
    fetchGoogleTrendsSignal(theme.theme),
    assessProductFit(theme.theme, ctx.category, youtube),
  ])

  return {
    theme: theme.theme,
    queries,
    youtube,
    trends,
    productFit,
    sellbop,
  }
}

/** Research 3-5 problem themes with YouTube, trends, query discovery, and product fit. */
export async function researchThemes(
  themes: ResearchTheme[],
  ctx: ProviderContext,
): Promise<Map<string, ThemeResearchBundle>> {
  const selected = themes.slice(0, MAX_RESEARCH_THEMES)
  const map = new Map<string, ThemeResearchBundle>()
  if (selected.length === 0) return map

  const allSeeds = selected.flatMap(t => [t.theme, ...t.seedQueries])
  const [allQueries, sellbop] = await Promise.all([
    discoverRelatedQueries(allSeeds),
    fetchSellBopSignal(ctx.category),
  ])

  const results = await Promise.all(
    selected.map(theme => researchTheme(theme, allQueries, sellbop, ctx).catch(err => {
      console.error('[Product Ideas] theme research failed:', theme.theme, err)
      return {
        theme: theme.theme,
        queries: queriesForTheme(allQueries, theme.theme, theme.seedQueries),
        youtube: { ...UNAVAILABLE_YOUTUBE },
        trends: { ...UNAVAILABLE_TRENDS },
        productFit: { ...UNAVAILABLE_PRODUCT_FIT },
        sellbop,
      } satisfies ThemeResearchBundle
    })),
  )

  for (const bundle of results) {
    map.set(bundle.theme.toLowerCase(), bundle)
  }

  return map
}

export function bundleToResearch(bundle: ThemeResearchBundle): ProductIdeaResearch {
  return {
    theme: bundle.theme,
    queries: bundle.queries,
    youtube: bundle.youtube,
    trends: bundle.trends,
    productFit: bundle.productFit,
    sellbop: bundle.sellbop,
  }
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase()
}

export function lookupResearch(
  themeMap: Map<string, ThemeResearchBundle>,
  primaryKeyword: string | null,
): ProductIdeaResearch | undefined {
  if (!primaryKeyword) return undefined

  const key = normalizeKey(primaryKeyword)
  const direct = themeMap.get(key)
  if (direct) return bundleToResearch(direct)

  for (const bundle of themeMap.values()) {
    if (normalizeKey(bundle.theme) === key) return bundleToResearch(bundle)
    if (bundle.queries.some(q => normalizeKey(q.query) === key)) return bundleToResearch(bundle)
  }

  return undefined
}

export function findBestThemeMatch(
  themeMap: Map<string, ThemeResearchBundle>,
  primaryKeyword: string | null,
  supportingKeywords: string[],
): ProductIdeaResearch | undefined {
  const direct = lookupResearch(themeMap, primaryKeyword)
  if (direct) return direct

  for (const kw of supportingKeywords) {
    const match = lookupResearch(themeMap, kw)
    if (match) return match
  }

  return undefined
}
