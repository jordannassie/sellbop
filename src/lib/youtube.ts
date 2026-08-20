/** Extract a YouTube video ID from common URL formats, or null if invalid. */
export function parseYouTubeVideoId(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  let parsed: URL
  try {
    parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
  } catch {
    return null
  }

  const host = parsed.hostname.replace(/^www\./, '').toLowerCase()
  if (host === 'youtu.be') {
    const id = parsed.pathname.slice(1).split('/')[0]
    return isValidYouTubeVideoId(id) ? id : null
  }

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const path = parsed.pathname

    if (path === '/watch') {
      const id = parsed.searchParams.get('v')
      return isValidYouTubeVideoId(id) ? id! : null
    }

    if (path.startsWith('/shorts/')) {
      const id = path.slice('/shorts/'.length).split('/')[0]
      return isValidYouTubeVideoId(id) ? id : null
    }

    if (path.startsWith('/embed/')) {
      const id = path.slice('/embed/'.length).split('/')[0]
      return isValidYouTubeVideoId(id) ? id : null
    }

    if (path.startsWith('/v/')) {
      const id = path.slice('/v/'.length).split('/')[0]
      return isValidYouTubeVideoId(id) ? id : null
    }
  }

  return null
}

function isValidYouTubeVideoId(id: string | null | undefined): id is string {
  return typeof id === 'string' && /^[\w-]{11}$/.test(id)
}

/** True when the string is empty or a supported YouTube URL. */
export function isValidYouTubeUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return true
  return parseYouTubeVideoId(trimmed) !== null
}

/** Build a privacy-friendly embed URL (no autoplay). */
export function youTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`
}

/** Resolve a stored shop value video URL to an embed src, or null. */
export function youTubeEmbedFromUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null
  const id = parseYouTubeVideoId(url)
  return id ? youTubeEmbedUrl(id) : null
}
