import { requireAdminUser } from '@/lib/admin/access'
import { PartnershipsAdminClient } from '@/components/admin/partnerships-admin-client'

export default async function AdminPartnershipsPage() {
  await requireAdminUser()
  return <PartnershipsAdminClient />
}
