'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { MobileEditorNav } from '@/components/dashboard/mobile-editor-nav'
import { cn } from '@/lib/utils'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isStoreEditor = pathname.startsWith('/dashboard/store-editor')

  // All routes that are part of the mobile editor workspace
  const isProductEditorRoute =
    pathname === '/dashboard/products' ||
    pathname === '/dashboard/products/new' ||
    /^\/dashboard\/products\/.+$/.test(pathname)

  // Show mobile editor nav on store-editor AND all product editor routes
  const showMobileEditorNav = isStoreEditor || isProductEditorRoute

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
    <div className={cn('flex bg-neutral-50', isStoreEditor ? 'h-screen overflow-hidden' : 'min-h-screen')}>
      <DashboardSidebar />
      {/* pt-14 offsets the mobile fixed top bar; removed on lg where sidebar is always shown */}
      <div className={cn(
        'flex-1 flex flex-col min-w-0 overflow-x-hidden pt-14 lg:pt-0',
        isStoreEditor && 'overflow-hidden',
      )}>
        <main className={cn(
          'flex-1 min-h-0',
          isStoreEditor
            ? 'p-0 overflow-hidden flex flex-col'
            : isProductEditorRoute
              ? 'p-4 pb-20 sm:p-6 sm:pb-6 lg:p-8 lg:pb-8 max-w-6xl'
              : 'p-4 sm:p-6 lg:p-8 max-w-6xl',
        )}>
          {children}
        </main>
      </div>

      {/* Persistent mobile editor nav across all editor routes */}
      {showMobileEditorNav && <MobileEditorNav />}
    </div>
  )
}
