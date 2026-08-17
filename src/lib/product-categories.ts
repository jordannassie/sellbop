/** Canonical SellBop product categories — single source of truth. */
export const PRODUCT_CATEGORIES = [
  'Business & Marketing',
  'Money & Finance',
  'Health & Fitness',
  'Beauty & Fashion',
  'Education & Career',
  'Real Estate',
  'Food & Nutrition',
  'Lifestyle & Relationships',
  'Travel',
  'Creative & Design',
  'Tech & AI',
  'Faith & Spirituality',
  'Home & DIY',
  'Other',
] as const

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]

/** Marketplace filter list — "All" plus canonical categories. */
export const MARKETPLACE_CATEGORY_FILTERS = ['All', ...PRODUCT_CATEGORIES] as const

/** Map legacy stored values to the closest canonical category. */
const LEGACY_CATEGORY_MAP: Record<string, ProductCategory> = {
  Business: 'Business & Marketing',
  Money: 'Money & Finance',
  Fitness: 'Health & Fitness',
  Education: 'Education & Career',
  Faith: 'Faith & Spirituality',
  Design: 'Creative & Design',
  'Real Estate': 'Real Estate',
  Templates: 'Other',
  Other: 'Other',
}

/** Normalize a stored category for display and form selection. */
export function normalizeProductCategory(category: string | null | undefined): string | null {
  if (!category?.trim()) return null
  const trimmed = category.trim()
  if ((PRODUCT_CATEGORIES as readonly string[]).includes(trimmed)) return trimmed
  return LEGACY_CATEGORY_MAP[trimmed] ?? trimmed
}

/** All DB values that should match a canonical marketplace filter. */
export function getCategoryFilterValues(canonicalCategory: string): string[] {
  const values = new Set<string>([canonicalCategory])
  for (const [legacy, mapped] of Object.entries(LEGACY_CATEGORY_MAP)) {
    if (mapped === canonicalCategory) values.add(legacy)
  }
  return [...values]
}

export function isProductCategory(value: string): value is ProductCategory {
  return (PRODUCT_CATEGORIES as readonly string[]).includes(value)
}
