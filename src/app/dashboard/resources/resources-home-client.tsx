'use client'

import { ResourceHomeCards } from '@/components/resources/resource-content'
import type { ResourceCardRow } from '@/lib/resources/types'

export function ResourcesHomeClient({ initialCards }: { initialCards: ResourceCardRow[] }) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-black">Resources</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Everything you need to create, sell, and grow with SellBop.
        </p>
      </div>
      <ResourceHomeCards cards={initialCards} />
    </div>
  )
}
