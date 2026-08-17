import { notFound } from 'next/navigation'
import { fetchResourcePage } from '@/lib/resources/fetch'
import { ResourceDetailClient } from './resource-detail-client'

export const dynamic = 'force-dynamic'

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const page = await fetchResourcePage(slug)

  if (!page) notFound()

  return <ResourceDetailClient page={page} />
}
