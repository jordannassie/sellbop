import { requireAdminUser } from '@/lib/admin/access'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminUser()

  return (
    <div className="min-h-screen bg-neutral-50">
      {children}
    </div>
  )
}
