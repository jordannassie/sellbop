'use client'
import { Suspense } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Layers, ShoppingBag, BarChart3, User } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────
// Main mobile bottom nav — 4 primary destinations.
// "Editor" is first and covers all store-editor + product routes
// so the user always feels inside one editing workspace.
// ─────────────────────────────────────────────────────────────

function MobileEditorNavInner() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  // "Editor" is active for all store-editor AND product-management routes
  const isEditorArea =
    pathname.startsWith('/dashboard/store-editor') ||
    pathname === '/dashboard/products' ||
    pathname === '/dashboard/products/new' ||
    /^\/dashboard\/products\/.+$/.test(pathname)

  const active =
    isEditorArea                          ? 'editor'    :
    pathname.startsWith('/dashboard/orders')    ? 'orders'    :
    pathname.startsWith('/dashboard/analytics') ? 'analytics' :
    pathname === '/dashboard/storefront'        ? 'profile'   :
                                                  ''

  // Suppress unused-var warning — searchParams is read by useSearchParams
  void searchParams

  const items = [
    { id: 'editor',    label: 'Editor',    Icon: Layers,      target: '/dashboard/store-editor' },
    { id: 'orders',    label: 'Orders',    Icon: ShoppingBag, target: '/dashboard/orders' },
    { id: 'analytics', label: 'Analytics', Icon: BarChart3,   target: '/dashboard/analytics' },
    { id: 'profile',   label: 'Profile',   Icon: User,        target: '/dashboard/storefront' },
  ]

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 flex items-stretch h-14">
      {items.map(({ id, label, Icon, target }) => (
        <button
          key={id}
          onClick={() => router.push(target)}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
            active === id ? 'text-black' : 'text-neutral-400',
          )}
        >
          <Icon size={20} strokeWidth={active === id ? 2.5 : 1.75} />
          <span className="text-[10px] font-semibold">{label}</span>
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Public export — Suspense boundary so useSearchParams is safe
// ─────────────────────────────────────────────────────────────

export function MobileEditorNav() {
  return (
    <Suspense fallback={null}>
      <MobileEditorNavInner />
    </Suspense>
  )
}
