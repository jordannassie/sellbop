import type { ProductMediaProvider } from './types'

export interface ParsedVideoLink {
  provider: Exclude<ProductMediaProvider, 'upload'>
  url: string
  embedUrl: string
  thumbnailUrl: string | null
}

const ALLOWED_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'm.youtube.com',
  'loom.com',
  'www.loom.com',
  'vimeo.com',
  'www.vimeo.com',
  'player.vimeo.com',
  'wistia.com',
  'www.wistia.com',
  'fast.wistia.net',
]

function parseYouTubeId(input: URL): string | null {
  if (input.hostname === 'youtu.be') {
    return input.pathname.slice(1).split('/')[0] || null
  }
  if (input.pathname.startsWith('/shorts/')) {
    return input.pathname.split('/')[2] || null
  }
  return input.searchParams.get('v')
}

function parseVimeoId(input: URL): string | null {
  const parts = input.pathname.split('/').filter(Boolean)
  const id = parts[parts.length - 1]
  return id && /^\d+$/.test(id) ? id : null
}

function parseWistiaId(input: URL): string | null {
  const parts = input.pathname.split('/').filter(Boolean)
  const mediasIdx = parts.indexOf('medias')
  if (mediasIdx >= 0 && parts[mediasIdx + 1]) return parts[mediasIdx + 1]
  const embedIdx = parts.indexOf('embed')
  if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1]
  return null
}

function parseLoomId(input: URL): string | null {
  const parts = input.pathname.split('/').filter(Boolean)
  const shareIdx = parts.indexOf('share')
  if (shareIdx >= 0 && parts[shareIdx + 1]) return parts[shareIdx + 1]
  return parts[parts.length - 1] || null
}

/** Validate and normalize a supported video URL. Returns null if invalid. */
export function parseVideoLink(raw: string): ParsedVideoLink | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  let parsed: URL
  try {
    parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
  } catch {
    return null
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) return null
  if (!ALLOWED_HOSTS.includes(parsed.hostname)) return null

  const host = parsed.hostname.replace(/^www\./, '')

  if (host === 'youtu.be' || host === 'youtube.com' || host === 'm.youtube.com') {
    const videoId = parseYouTubeId(parsed)
    if (!videoId) return null
    const canonical = `https://www.youtube.com/watch?v=${videoId}`
    return {
      provider: 'youtube',
      url: canonical,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    }
  }

  if (host === 'loom.com') {
    const videoId = parseLoomId(parsed)
    if (!videoId) return null
    const canonical = `https://www.loom.com/share/${videoId}`
    return {
      provider: 'loom',
      url: canonical,
      embedUrl: `https://www.loom.com/embed/${videoId}`,
      thumbnailUrl: null,
    }
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const videoId = parseVimeoId(parsed)
    if (!videoId) return null
    const canonical = `https://vimeo.com/${videoId}`
    return {
      provider: 'vimeo',
      url: canonical,
      embedUrl: `https://player.vimeo.com/video/${videoId}`,
      thumbnailUrl: null,
    }
  }

  if (host === 'wistia.com' || host === 'fast.wistia.net') {
    const videoId = parseWistiaId(parsed)
    if (!videoId) return null
    const canonical = `https://fast.wistia.net/embed/iframe/${videoId}`
    return {
      provider: 'wistia',
      url: canonical,
      embedUrl: `https://fast.wistia.net/embed/iframe/${videoId}`,
      thumbnailUrl: null,
    }
  }

  return null
}

export function getVideoEmbedUrl(item: {
  provider: ProductMediaProvider
  url: string
  embed_url?: string | null
}): string | null {
  if (item.embed_url) return item.embed_url
  if (item.provider === 'upload') return null
  return parseVideoLink(item.url)?.embedUrl ?? null
}
