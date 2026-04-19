'use client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { ProductType } from '@/lib/domain/entities'

interface Props {
  product: { id: string; name: string; ctaText: string; productType: ProductType }
}

export function BuyButton({ product }: Props) {
  const router = useRouter()
  function handleBuy() {
    router.push(`/checkout/${product.id}`)
  }
  return <Button className="w-full" size="lg" onClick={handleBuy}>{product.ctaText}</Button>
}
