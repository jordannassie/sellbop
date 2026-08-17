'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const FAQ = [
  {
    q: 'Does SellBop charge a monthly fee?',
    a: 'No. Sellers can create an account and list products without a monthly subscription. SellBop earns a transaction fee when products sell.',
  },
  {
    q: 'What is a direct sale?',
    a: 'A direct sale is a purchase generated through your own SellBop profile, storefront, product page, or direct link.',
  },
  {
    q: 'What is a marketplace sale?',
    a: 'A marketplace sale is a purchase generated through SellBop marketplace discovery rather than through your own direct traffic.',
  },
  {
    q: 'How do affiliate commissions work?',
    a: 'The seller decides whether affiliates are enabled and chooses the commission percentage. When an affiliate generates a qualifying sale, the affiliate earns the selected commission.',
  },
  {
    q: 'Does it cost money to become an affiliate?',
    a: 'No. Creating a SellBop account and promoting affiliate-enabled products is free. You earn commission when you generate a qualifying sale.',
  },
  {
    q: 'Are payment processing fees included?',
    a: 'Standard payment processing fees may apply separately from SellBop platform fees.',
  },
]

export function PricingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="space-y-2">
      {FAQ.map(({ q, a }, i) => {
        const open = openIndex === i
        return (
          <div key={q} className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={open}
            >
              <span className="text-sm font-bold text-black">{q}</span>
              <ChevronDown
                size={16}
                className={cn('text-neutral-400 shrink-0 transition-transform', open && 'rotate-180')}
              />
            </button>
            {open && (
              <div className="px-5 pb-4 -mt-1">
                <p className="text-sm text-neutral-500 leading-relaxed">{a}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
