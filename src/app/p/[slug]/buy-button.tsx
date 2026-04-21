'use client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { ProductType } from '@/lib/domain/entities'

interface Props {
  product: { id: string; name: string; ctaText: string; productType: ProductType }
  accent?: string
}

export function BuyButton({ product, accent }: Props) {
  const router = useRouter()
  function handleBuy() {
    router.push(`/checkout/${product.id}`)
  }

  if (accent && accent !== '#000000') {
    return (
      <button
        onClick={handleBuy}
        className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 active:opacity-80"
        style={{ backgroundColor: accent }}
      >
        {product.ctaText}
      </button>
    )
  }

  return (
    <Button className="w-full" size="lg" onClick={handleBuy}>
      {product.ctaText}
    </Button>
  )
}
