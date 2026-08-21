import type { ProductIdea } from './types'

function formatPriceRange(minCents: number, maxCents: number): string {
  const min = Math.round(minCents / 100)
  const max = Math.round(maxCents / 100)
  return `$${min}-$${max}`
}

export function buildLaunchUrl(idea: Pick<ProductIdea, 'title' | 'targetAudience' | 'suggestedPriceMinCents' | 'suggestedPriceMaxCents'>): string {
  const params = new URLSearchParams()
  params.set('idea', idea.title)
  if (idea.targetAudience) params.set('audience', idea.targetAudience)
  if (idea.suggestedPriceMinCents && idea.suggestedPriceMaxCents) {
    params.set('priceRange', formatPriceRange(idea.suggestedPriceMinCents, idea.suggestedPriceMaxCents))
  }
  return `/dashboard/ai-launch?${params.toString()}`
}
