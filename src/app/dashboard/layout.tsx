'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { MobileEditorNav } from '@/components/dashboard/mobile-editor-nav'
import { MobileTopMiniNav } from '@/components/dashboard/mobile-top-mini-nav'
import { cn } from '@/lib/utils'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isStoreEditor = pathname.startsWith('/dashboard/store-editor')

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

      {/*
        Mobile top offset:
          - pt-14: header (56px) only — submenu is now fixed at bottom, not top
          - lg:pt-0: desktop sidebar replaces fixed header entirely
      */}
      <div className={cn(
        'flex-1 flex flex-col min-w-0 overflow-x-hidden pt-14 lg:pt-0',
        isStoreEditor && 'overflow-hidden',
      )}>
        <main className={cn(
          'flex-1 min-h-0',
          isStoreEditor
            ? 'p-0 overflow-hidden flex flex-col'
            // pb-24 clears both the bottom nav (56px) and the editor submenu (40px)
            // on mobile. Safe for all pages — excess clearance is harmless.
            : 'p-4 pb-24 sm:p-6 sm:pb-6 lg:p-8 lg:pb-8 max-w-6xl',
        )}>
          {children}
        </main>
      </div>

      {/* ── Persistent mobile navs — shown on ALL signed-in dashboard pages ── */}
      {/* Top mini nav: Overview, Orders, Customers, Analytics, Settings      */}
      <MobileTopMiniNav />
      {/* Bottom editor nav: Products, Add, Preview, Design, Profile          */}
      <MobileEditorNav />
    </div>
  )
}
