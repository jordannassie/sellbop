'use client'
import { useState } from 'react'
import Image from 'next/image'
import { GradientImageFallback } from './gradient-image-fallback'
import type { ProductType } from '@/lib/domain/entities'

interface ProductImageProps {
  src: string | null | undefined
  alt: string
  productType?: ProductType | string
  fill?: boolean
  width?: number
  height?: number
  className?: string
  iconSize?: 'sm' | 'md' | 'lg'
}

export function ProductImage({
  src,
  alt,
  productType,
  fill = false,
  width,
  height,
  className,
  iconSize = 'md',
}: ProductImageProps) {
  const [broken, setBroken] = useState(false)

  if (!src || broken) {
    return <GradientImageFallback productType={productType} iconSize={iconSize} />
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className ?? 'object-cover'}
        unoptimized
        onError={() => setBroken(true)}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 800}
      height={height ?? 450}
      className={className ?? 'w-full h-full object-cover'}
      unoptimized
      onError={() => setBroken(true)}
    />
  )
}
