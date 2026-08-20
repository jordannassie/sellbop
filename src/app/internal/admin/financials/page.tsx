import { requireAdminUser } from '@/lib/admin/access'
import { AdminFinancialsClient } from '@/components/admin/admin-financials-client'

export default async function AdminFinancialsPage() {
  await requireAdminUser()
  return <AdminFinancialsClient />
}
