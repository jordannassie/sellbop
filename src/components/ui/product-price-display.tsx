import { formatCurrency } from '@/lib/utils'
import type { EffectiveProductPrice } from '@/lib/pricing/product-price'
import { cn } from '@/lib/utils'

const SIZE_CLASSES = {
  sm: {
    current: 'text-sm font-bold text-black',
    was: 'text-xs text-neutral-400 line-through',
    badge: 'text-[10px] font-bold uppercase tracking-wide',
  },
  md: {
    current: 'text-base font-bold text-black',
    was: 'text-sm text-neutral-400 line-through',
    badge: 'text-[11px] font-bold uppercase tracking-wide',
  },
  lg: {
    current: 'text-3xl sm:text-4xl font-black text-black tracking-tight',
    was: 'text-lg text-neutral-400 line-through',
    badge: 'text-xs font-bold uppercase tracking-wide',
  },
} as const

interface ProductPriceDisplayProps {
  pricing: EffectiveProductPrice
  size?: keyof typeof SIZE_CLASSES
  showBadge?: boolean
  badgeVariant?: 'percent' | 'sale'
  className?: string
}

export function ProductPriceDisplay({
  pricing,
  size = 'md',
  showBadge = false,
  badgeVariant = 'percent',
  className,
}: ProductPriceDisplayProps) {
  const styles = SIZE_CLASSES[size]

  if (pricing.regularPriceCents === 0) {
    return <span className={cn(styles.current, className)}>Free</span>
  }

  if (!pricing.isOnSale) {
    return (
      <span className={cn(styles.current, className)}>
        {formatCurrency(pricing.regularPriceCents)}
      </span>
    )
  }

  const badgeLabel =
    badgeVariant === 'sale' ? 'SALE' : `${pricing.discountPercent ?? 0}% OFF`

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className={styles.was}>{formatCurrency(pricing.regularPriceCents)}</span>
      <span className={styles.current}>{formatCurrency(pricing.effectivePriceCents)}</span>
      {showBadge && (
        <span
          className={cn(
            styles.badge,
            'inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700',
          )}
        >
          {badgeLabel}
        </span>
      )}
    </div>
  )
}
