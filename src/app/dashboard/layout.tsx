'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { cn } from '@/lib/utils'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { MobileEditorNav } from '@/components/dashboard/mobile-editor-nav'
import { MobileTopMiniNav } from '@/components/dashboard/mobile-top-mini-nav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, account, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isStoreEditor = pathname.startsWith('/dashboard/store-editor')

  useEffect(() => {
    if (loading) return

    if (!session) {
      router.push('/login')
    }
  }, [loading, router, session])

  if (loading || !session || !account) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    )
  }

  return (
    <div className={cn('flex bg-neutral-50', isStoreEditor ? 'h-screen overflow-hidden' : 'min-h-screen')}>
      <DashboardSidebar />

      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col overflow-x-hidden pt-14 lg:pt-0',
          isStoreEditor && account.hasStore && 'overflow-hidden',
        )}
      >
        <main
          className={cn(
            'min-h-0 flex-1',
            isStoreEditor && account.hasStore
              ? 'flex flex-col overflow-hidden p-0'
              : 'w-full max-w-6xl p-4 pb-28 sm:p-6 sm:pb-8 lg:p-8 lg:pb-10',
          )}
        >
          {children}
        </main>
      </div>

      <MobileTopMiniNav />
      <MobileEditorNav />
    </div>
  )
}
