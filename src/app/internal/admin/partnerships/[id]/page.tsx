import { requireAdminUser } from '@/lib/admin/access'
import { PartnershipDetailClient } from '@/components/admin/partnership-detail-client'

export default async function PartnershipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdminUser()
  const { id } = await params
  return <PartnershipDetailClient partnershipId={id} />
}
