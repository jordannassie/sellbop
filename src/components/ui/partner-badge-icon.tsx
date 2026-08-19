import { PARTNER_BADGE_BLUE } from '@/lib/partner-badge'

interface PartnerBadgeIconProps {
  size?: number
  className?: string
}

/** Scalloped verified-style SellBop Partner badge with white checkmark. */
export function PartnerBadgeIcon({ size, className }: PartnerBadgeIconProps) {
  return (
    <svg
      {...(size ? { width: size, height: size } : {})}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        fill={PARTNER_BADGE_BLUE}
        d="M12 2.15l1.72 1.05 2.01-.28.86 1.82 1.91.77-.29 2.01 1.05 1.72-1.05 1.72.29 2.01-1.91.77-.86 1.82-2.01-.28L12 21.85l-1.72-1.05-2.01.28-.86-1.82-1.91-.77.29-2.01L3.3 12l-1.05-1.72.29-2.01 1.91-.77.86-1.82 2.01.28L12 2.15z"
      />
      <path
        fill="white"
        d="M10.15 13.35L8.4 11.6l-.95.95 2.7 2.7 5.7-5.7-.95-.95-4.75 4.75z"
      />
    </svg>
  )
}
