import { PartnerBadgeIcon } from '@/components/ui/partner-badge-icon'
import { shouldShowPartnerBadge } from '@/lib/partner-badge'
import { cn } from '@/lib/utils'

interface AvatarWithPartnerBadgeProps {
  children: React.ReactNode
  isPartner?: boolean | null
  showPartnerBadge?: boolean | null
  className?: string
  style?: React.CSSProperties
  badgeClassName?: string
  /** Badge size as a fraction of the avatar diameter (default 0.32). */
  badgeScale?: number
}

/**
 * Wraps a circular avatar and attaches the SellBop Partner badge at bottom-right.
 */
export function AvatarWithPartnerBadge({
  children,
  isPartner,
  showPartnerBadge,
  className,
  style,
  badgeClassName,
  badgeScale = 0.32,
}: AvatarWithPartnerBadgeProps) {
  const visible = shouldShowPartnerBadge(isPartner, showPartnerBadge)

  return (
    <div className={cn('relative inline-flex shrink-0', className)} style={style}>
      {children}
      {visible && (
        <span
          className={cn(
            'pointer-events-none absolute bottom-0 right-0 z-10 flex items-center justify-center rounded-full bg-white p-[8%] shadow-sm ring-2 ring-white',
            badgeClassName,
          )}
          style={{
            width: `${badgeScale * 100}%`,
            height: `${badgeScale * 100}%`,
            transform: 'translate(18%, 10%)',
          }}
          title="SellBop Partner"
          aria-label="SellBop Partner"
        >
          <PartnerBadgeIcon className="h-full w-full" />
        </span>
      )}
    </div>
  )
}
