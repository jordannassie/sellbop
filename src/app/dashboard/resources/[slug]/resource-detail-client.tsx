'use client'

import { ConnectAiPage } from '@/components/resources/connect-ai-page'
import { ResourcePageHeader, ResourcePageView } from '@/components/resources/resource-content'
import type { ResourcePageRow } from '@/lib/resources/types'

export function ResourceDetailClient({ page }: { page: ResourcePageRow }) {
  if (page.slug === 'connect-ai') {
    return <ConnectAiPage />
  }

  return (
    <div>
      <ResourcePageHeader page={page} />
      <ResourcePageView page={page} />
    </div>
  )
}
