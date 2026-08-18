'use client'

import { Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PRODUCT_IMAGE_ASPECT_RATIO } from '@/lib/product-media/constants'

export interface ProductCardImageProps {
  src?: string | null
  alt: string
  className?: string
  imageClassName?: string
  /** Enable subtle zoom on group hover (parent should include `group`). */
  hoverScale?: boolean
  children?: React.ReactNode
}

/** Standard 1:1 product image area for SellBop product cards. */
export function ProductCardImage({
  src,
  alt,
  className,
  imageClassName,
  hoverScale = false,
  children,
}: ProductCardImageProps) {
  return (
    <div
      className={cn('relative w-full overflow-hidden bg-neutral-100', className)}
      style={{ aspectRatio: PRODUCT_IMAGE_ASPECT_RATIO }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={cn(
            'absolute inset-0 h-full w-full object-cover object-center',
            hoverScale && 'transition-transform duration-300 group-hover:scale-[1.02]',
            imageClassName,
          )}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Package size={28} className="text-neutral-300" />
        </div>
      )}
      {children}
    </div>
  )
}
