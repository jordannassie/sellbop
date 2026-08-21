import 'server-only'

import { env } from '@/lib/env'
import { cached, cacheKey, CACHE_TTL } from '../cache'
import { breakoutLevel, type YouTubeSignal, type YouTubeVideoExample } from '../types'
import { UNAVAILABLE_YOUTUBE } from '../types'

const YOUTUBE_BASE = 'https://www.googleapis.com/youtube/v3'
const MIN_VIDEOS_FOR_SCORE = 3

export function isYouTubeConfigured(): boolean {
  return !!env.productIdeas.youtubeApiKey
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value))
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

function daysSince(iso: string): number {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return 9999
  return (Date.now() - then) / (1000 * 60 * 60 * 24)
}

function recencyScore(days: number): number {
  if (days <= 90) return 100
  if (days <= 180) return 80
  if (days <= 365) return 55
  return 30
}

function logViewStrength(views: number[]): number {
  if (views.length === 0) return 0
  const normalized = views.map(v => clamp((Math.log10(v + 1) / 7) * 100))
  const avg = normalized.reduce((s, v) => s + v, 0) / normalized.length
  return clamp(avg)
}

function breakoutStrengthFromVideos(examples: YouTubeVideoExample[]): number {
  const ratios = examples
    .map(e => e.breakoutRatio)
    .filter((r): r is number => r != null && r >= 3)

  if (ratios.length === 0) return 0

  const sorted = [...ratios].sort((a, b) => b - a)
  const top = sorted.slice(0, 3)
  const avgTop = top.reduce((s, r) => s + r, 0) / top.length
  const multiBonus = Math.min(20, (ratios.length - 1) * 8)
  return clamp(Math.min(100, avgTop * 8 + multiBonus))
}

function momentumFromVideos(examples: YouTubeVideoExample[]): {
  score: number
  label: YouTubeSignal['recentMomentum']
} {
  if (examples.length === 0) return { score: 0, label: 'unknown' }

  const recentScores = examples
    .filter(e => e.views != null && e.views >= 1000)
    .map(e => recencyScore(daysSince(e.publishedAt)))

  if (recentScores.length === 0) {
    return { score: 30, label: 'limited' }
  }

  const score = clamp(recentScores.reduce((s, v) => s + v, 0) / recentScores.length)
  let label: YouTubeSignal['recentMomentum'] = 'limited'
  if (score >= 85) label = 'rising'
  else if (score >= 70) label = 'strong'
  else if (score >= 50) label = 'moderate'

  return { score, label }
}

function crossCreatorScore(uniqueCreators: number, strongVideos: number): number {
  if (uniqueCreators <= 1) return clamp(strongVideos * 15)
  return clamp(Math.min(100, uniqueCreators * 22 + strongVideos * 5))
}

export function computeYouTubeScores(examples: YouTubeVideoExample[]): {
  youtubeDemandScore: number | null
  viewStrengthScore: number
  breakoutStrengthScore: number
  momentumScore: number
  crossCreatorScore: number
  recentMomentum: YouTubeSignal['recentMomentum']
  breakoutVideoCount: number
} {
  const viewCounts = examples.map(e => e.views).filter((v): v is number => v != null)
  if (viewCounts.length < MIN_VIDEOS_FOR_SCORE) {
    return {
      youtubeDemandScore: null,
      viewStrengthScore: 0,
      breakoutStrengthScore: 0,
      momentumScore: 0,
      crossCreatorScore: 0,
      recentMomentum: 'unknown',
      breakoutVideoCount: 0,
    }
  }

  const viewStrengthScore = logViewStrength(viewCounts)
  const breakoutStrengthScore = breakoutStrengthFromVideos(examples)
  const { score: momentumScore, label: recentMomentum } = momentumFromVideos(examples)
  const breakoutVideoCount = examples.filter(e => e.breakoutLevel != null).length
  const uniqueCreators = new Set(examples.map(e => e.channelTitle)).size
  const strongVideos = examples.filter(e => (e.views ?? 0) >= 5000).length
  const crossCreator = crossCreatorScore(uniqueCreators, strongVideos)

  const youtubeDemandScore = Math.round(
    viewStrengthScore * 0.35
    + breakoutStrengthScore * 0.30
    + momentumScore * 0.20
    + crossCreator * 0.15,
  )

  return {
    youtubeDemandScore,
    viewStrengthScore,
    breakoutStrengthScore,
    momentumScore,
    crossCreatorScore: crossCreator,
    recentMomentum,
    breakoutVideoCount,
  }
}

async function youtubeGet<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const apiKey = env.productIdeas.youtubeApiKey
  if (!apiKey) return null

  const url = new URL(`${YOUTUBE_BASE}/${path}`)
  url.searchParams.set('key', apiKey)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const response = await fetch(url.toString())
  if (!response.ok) {
    console.error('[YouTube] API error:', path, response.status)
    return null
  }
  return response.json() as Promise<T>
}

export async function fetchYouTubeSignal(theme: string): Promise<YouTubeSignal> {
  if (!isYouTubeConfigured() || !theme.trim()) {
    return { ...UNAVAILABLE_YOUTUBE }
  }

  return cached(cacheKey('youtube', [theme]), CACHE_TTL.youtube, async () => {
    try {
      const search = await youtubeGet<{
        items?: { id?: { videoId?: string }; snippet?: { title?: string; channelTitle?: string; publishedAt?: string; channelId?: string } }[]
      }>('search', {
        part: 'snippet',
        q: theme.trim(),
        type: 'video',
        maxResults: '10',
        order: 'relevance',
        relevanceLanguage: 'en',
      })

      const videoIds = (search?.items ?? [])
        .map(i => i.id?.videoId)
        .filter((id): id is string => !!id)

      if (videoIds.length === 0) return { ...UNAVAILABLE_YOUTUBE }

      const videos = await youtubeGet<{
        items?: {
          id?: string
          snippet?: { title?: string; channelTitle?: string; publishedAt?: string; channelId?: string }
          statistics?: { viewCount?: string }
        }[]
      }>('videos', {
        part: 'snippet,statistics',
        id: videoIds.join(','),
      })

      const channelIds = [...new Set(
        (videos?.items ?? [])
          .map(v => v.snippet?.channelId)
          .filter((id): id is string => !!id),
      )]

      const channels = channelIds.length > 0
        ? await youtubeGet<{ items?: { id?: string; statistics?: { subscriberCount?: string } }[] }>('channels', {
          part: 'statistics',
          id: channelIds.join(','),
        })
        : null

      const subsByChannel = new Map<string, number>()
      for (const ch of channels?.items ?? []) {
        if (ch.id && ch.statistics?.subscriberCount) {
          subsByChannel.set(ch.id, parseInt(ch.statistics.subscriberCount, 10))
        }
      }

      const examples: YouTubeVideoExample[] = []

      for (const v of videos?.items ?? []) {
        const videoId = v.id
        const snippet = v.snippet
        if (!videoId || !snippet?.title) continue

        const views = v.statistics?.viewCount ? parseInt(v.statistics.viewCount, 10) : null
        const channelId = snippet.channelId ?? null
        const channelSubscribers = channelId ? (subsByChannel.get(channelId) ?? null) : null

        const breakoutRatio = views != null && channelSubscribers != null
          ? views / Math.max(channelSubscribers, 1)
          : null

        examples.push({
          title: snippet.title,
          videoId,
          channelId,
          channelTitle: snippet.channelTitle ?? 'Unknown channel',
          views,
          channelSubscribers,
          breakoutRatio,
          breakoutLevel: breakoutLevel(breakoutRatio),
          publishedAt: snippet.publishedAt ?? '',
        })
      }

      examples.sort((a, b) => (b.views ?? 0) - (a.views ?? 0))

      const viewCounts = examples.map(e => e.views).filter((v): v is number => v != null)
      const scores = computeYouTubeScores(examples)

      if (scores.youtubeDemandScore == null) {
        return { ...UNAVAILABLE_YOUTUBE, relevantVideoCount: examples.length, examples: examples.slice(0, 5) }
      }

      const topBreakout = examples
        .map(e => e.breakoutRatio)
        .filter((r): r is number => r != null)
        .sort((a, b) => b - a)[0] ?? null

      return {
        available: true,
        youtubeDemandScore: scores.youtubeDemandScore,
        viewStrengthScore: scores.viewStrengthScore,
        breakoutStrengthScore: scores.breakoutStrengthScore,
        momentumScore: scores.momentumScore,
        crossCreatorScore: scores.crossCreatorScore,
        relevantVideoCount: examples.length,
        breakoutVideoCount: scores.breakoutVideoCount,
        uniqueCreatorCount: new Set(examples.map(e => e.channelTitle)).size,
        medianViews: median(viewCounts),
        topVideoViews: examples[0]?.views ?? null,
        topBreakoutRatio: topBreakout,
        recentMomentum: scores.recentMomentum,
        examples: examples.slice(0, 5),
      }
    } catch (err) {
      console.error('[YouTube provider]', err)
      return { ...UNAVAILABLE_YOUTUBE }
    }
  })
}
