'use client'

import { ResourcePageHeader, ResourcePageView } from '@/components/resources/resource-content'
import type { ResourcePageRow } from '@/lib/resources/types'

export function ResourceDetailClient({ page }: { page: ResourcePageRow }) {
  return (
    <div>
      <ResourcePageHeader page={page} />
      <ResourcePageView page={page} />
    </div>
  )
}
