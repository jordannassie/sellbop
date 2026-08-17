export function normalizeProductLinkUrl(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const url = new URL(withProtocol)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

export function productLinkDisplayName(url: string, customName?: string | null): string {
  if (customName?.trim()) return customName.trim()
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'Website link'
  }
}

export function isProductLink(fileType?: string | null, fileUrl?: string | null, storagePath?: string | null): boolean {
  return fileType === 'link' || (!!fileUrl && !storagePath)
}
