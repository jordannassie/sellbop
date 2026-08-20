export function sanitizeFilename(base: string, ext: string): string {
  const normalizedExt = ext.startsWith('.') ? ext : `.${ext}`
  const slug = base
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'product'
  return `${slug}${normalizedExt}`
}

export function uniqueFilename(base: string, ext: string, suffix?: string): string {
  const core = suffix ? `${base}-${suffix}` : base
  return sanitizeFilename(core, ext)
}
