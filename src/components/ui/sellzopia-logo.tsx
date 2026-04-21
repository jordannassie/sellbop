import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'

const SIZES = {
  sm: { icon: 14, text: 'text-sm', gap: 'gap-1.5', stroke: 2 },
  md: { icon: 17, text: 'text-base', gap: 'gap-2', stroke: 2 },
  lg: { icon: 20, text: 'text-lg', gap: 'gap-2', stroke: 2 },
}

interface SellBopLogoProps {
  size?: 'sm' | 'md' | 'lg'
  href?: string
  className?: string
}

function LogoMark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const { icon, text, gap, stroke } = SIZES[size]
  return (
    <span className={`inline-flex items-center ${gap}`}>
      <ShoppingBag
        size={icon}
        strokeWidth={stroke}
        className="text-green-500 shrink-0"
      />
      <span className={`font-bold text-black tracking-tight ${text}`}>SellBop</span>
    </span>
  )
}

export function SellBopLogo({ size = 'md', href = '/', className = '' }: SellBopLogoProps) {
  return (
    <Link href={href} className={`inline-flex items-center ${className}`}>
      <LogoMark size={size} />
    </Link>
  )
}

export function SellBopLogoStatic({ size = 'md', className = '' }: Omit<SellBopLogoProps, 'href'>) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <LogoMark size={size} />
    </span>
  )
}
