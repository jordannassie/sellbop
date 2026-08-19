/** Normalize a line from the social links textarea into a clickable URL if possible. */
export function lineToUrl(line: string): string | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  if (/^https?:\/\//i.test(trimmed)) return trimmed

  if (/^[\w.-]+\.[a-z]{2,}/i.test(trimmed) && !trimmed.includes(' ')) {
    return `https://${trimmed}`
  }

  if (trimmed.startsWith('@')) {
    const handle = trimmed.slice(1)
    if (handle) return `https://instagram.com/${handle}`
  }

  return null
}

export function splitSocialLinkLines(text: string): string[] {
  return text.split('\n').map(line => line.trim()).filter(Boolean)
}
