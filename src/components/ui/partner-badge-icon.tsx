import { PARTNER_BADGE_ICON_URL } from '@/lib/partner-badge'

interface PartnerBadgeIconProps {
  size?: number
  className?: string
}

/** SellBop Partner badge icon from brand asset library. */
export function PartnerBadgeIcon({ size, className }: PartnerBadgeIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={PARTNER_BADGE_ICON_URL}
      alt=""
      width={size}
      height={size}
      className={className ?? (size ? undefined : 'h-full w-full object-contain')}
      aria-hidden="true"
      draggable={false}
    />
  )
}
