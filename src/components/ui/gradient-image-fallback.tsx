import { FileText, Zap, RefreshCw, Package, Crown, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProductType } from '@/lib/domain/entities'

const GRADIENT_CONFIG: Record<string, { gradient: string; icon: React.ReactNode }> = {
  digital_download: {
    gradient: 'from-blue-500 via-indigo-500 to-purple-600',
    icon: <FileText size={28} className="text-white/60" />,
  },
  service_offer: {
    gradient: 'from-orange-400 via-pink-500 to-rose-500',
    icon: <Zap size={28} className="text-white/60" />,
  },
  subscription: {
    gradient: 'from-emerald-400 via-cyan-500 to-teal-600',
    icon: <RefreshCw size={28} className="text-white/60" />,
  },
  bundle: {
    gradient: 'from-violet-500 via-purple-500 to-blue-600',
    icon: <Package size={28} className="text-white/60" />,
  },
  membership_ready: {
    gradient: 'from-amber-400 via-orange-500 to-pink-500',
    icon: <Crown size={28} className="text-white/60" />,
  },
}

const DEFAULT_CONFIG = {
  gradient: 'from-violet-500 via-blue-500 to-cyan-400',
  icon: <Layers size={28} className="text-white/60" />,
}

interface GradientImageFallbackProps {
  productType?: ProductType | string
  className?: string
  iconSize?: 'sm' | 'md' | 'lg'
}

export function GradientImageFallback({ productType, className, iconSize = 'md' }: GradientImageFallbackProps) {
  const config = productType ? (GRADIENT_CONFIG[productType] ?? DEFAULT_CONFIG) : DEFAULT_CONFIG

  const iconScale =
    iconSize === 'sm' ? 'scale-75' : iconSize === 'lg' ? 'scale-125' : 'scale-100'

  return (
    <div
      className={cn(
        'w-full h-full bg-gradient-to-br flex items-center justify-center',
        config.gradient,
        className
      )}
    >
      <div className={cn('opacity-80', iconScale)}>{config.icon}</div>
    </div>
  )
}
