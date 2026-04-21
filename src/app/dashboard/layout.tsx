'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { DashboardSidebar } from '@/components/dashboard/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !session) router.push('/login')
  }, [session, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DashboardSidebar />
      {/* pt-14 offsets the mobile fixed top bar; removed on lg where sidebar is always shown */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden pt-14 lg:pt-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl">{children}</main>
      </div>
    </div>
  )
}
