/**
 * Future optional provider types — not used in V1 free stack.
 * Kept for DataForSEO / TikTok / SERP gap architecture extensibility.
 */
import type { Trend } from '../types'

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
