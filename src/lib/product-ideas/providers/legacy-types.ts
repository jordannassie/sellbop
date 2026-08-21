/** Future optional provider types — YouTube, SellBop, DataForSEO. Not used in Google Trends V1 critical path. */

import type { Trend } from '../types'

export type BreakoutLevel = 'major' | 'strong' | 'breakout' | null

export interface YouTubeVideoExample {
  title: string
  videoId: string
  channelId: string | null
  channelTitle: string
  views: number | null
  channelSubscribers: number | null
  breakoutRatio: number | null
  breakoutLevel: BreakoutLevel
  publishedAt: string
}

export interface YouTubeSignal {
  available: boolean
  youtubeDemandScore: number | null
  viewStrengthScore: number | null
  breakoutStrengthScore: number | null
  momentumScore: number | null
  crossCreatorScore: number | null
  relevantVideoCount: number
  breakoutVideoCount: number
  uniqueCreatorCount: number
  medianViews: number | null
  topVideoViews: number | null
  topBreakoutRatio: number | null
  recentMomentum: 'rising' | 'strong' | 'moderate' | 'limited' | 'unknown'
  examples: YouTubeVideoExample[]
}

export interface QuerySignal {
  query: string
  source: 'youtube' | 'autocomplete' | 'ai'
}

export type ProductFitLevel = 'very_strong' | 'strong' | 'moderate' | 'weak' | 'unknown'

export interface ProductFitSignal {
  available: boolean
  level: ProductFitLevel
  fitScore: number | null
  reason: string | null
}

export interface SellBopSignal {
  available: boolean
  demandScore: number | null
  sampleSize: number | null
  medianPriceCents: number | null
  categoryProductCount: number | null
  summary: string | null
}

export interface SearchSignal {
  available: boolean
  primaryKeyword: string | null
  supportingKeywords: string[]
  estimatedMonthlySearches: number | null
  cpc: number | null
  searchCompetition: number | null
  trend: Trend
  trendPercent: number | null
}

export interface KeywordMetric {
  keyword: string
  searchVolume: number | null
  cpc: number | null
  competition: number | null
  trend: Trend
  trendPercent: number | null
  opportunityScore: number | null
  monthlySearches?: { year: number; month: number; search_volume: number }[]
}

export interface CompetitorGapSignal {
  available: boolean
  digitalProductCompetitors: number | null
  informationalResults: number | null
  marketplaceResults: number | null
  gapScore: number | null
  level: 'large_gap' | 'some_gap' | 'crowded' | 'unknown'
  summary: string | null
}

export interface TikTokSignal {
  available: boolean
}

export const UNAVAILABLE_YOUTUBE: YouTubeSignal = {
  available: false,
  youtubeDemandScore: null,
  viewStrengthScore: null,
  breakoutStrengthScore: null,
  momentumScore: null,
  crossCreatorScore: null,
  relevantVideoCount: 0,
  breakoutVideoCount: 0,
  uniqueCreatorCount: 0,
  medianViews: null,
  topVideoViews: null,
  topBreakoutRatio: null,
  recentMomentum: 'unknown',
  examples: [],
}

export const UNAVAILABLE_PRODUCT_FIT: ProductFitSignal = {
  available: false,
  level: 'unknown',
  fitScore: null,
  reason: null,
}

export const UNAVAILABLE_SELLBOP: SellBopSignal = {
  available: false,
  demandScore: null,
  sampleSize: null,
  medianPriceCents: null,
  categoryProductCount: null,
  summary: null,
}

export const UNAVAILABLE_SEARCH: SearchSignal = {
  available: false,
  primaryKeyword: null,
  supportingKeywords: [],
  estimatedMonthlySearches: null,
  cpc: null,
  searchCompetition: null,
  trend: 'unknown',
  trendPercent: null,
}

export const UNAVAILABLE_COMPETITORS: CompetitorGapSignal = {
  available: false,
  digitalProductCompetitors: null,
  informationalResults: null,
  marketplaceResults: null,
  gapScore: null,
  level: 'unknown',
  summary: null,
}

export const UNAVAILABLE_TIKTOK: TikTokSignal = { available: false }

export function breakoutLevel(ratio: number | null): BreakoutLevel {
  if (ratio == null || ratio < 3) return null
  if (ratio >= 10) return 'major'
  if (ratio >= 5) return 'strong'
  return 'breakout'
}
