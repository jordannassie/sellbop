'use client'
import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Package, Plus, Smartphone, Palette, User } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────
// Editor submenu items — shown above the bottom nav when the
// user is inside the editing workspace.
// ─────────────────────────────────────────────────────────────

const EDITOR_ITEMS = [
  { id: 'products', href: '/dashboard/products',                     label: 'Products',    Icon: Package },
  { id: 'add',      href: '/dashboard/products/new',                 label: 'Add Product', Icon: Plus },
  { id: 'preview',  href: '/dashboard/store-editor?section=preview', label: 'Preview',     Icon: Smartphone },
  { id: 'design',   href: '/dashboard/store-editor?section=design',  label: 'Design',      Icon: Palette },
  { id: 'profile',  href: '/dashboard/storefront',                   label: 'Profile',     Icon: User },
]

function MobileEditorSubmenuInner() {
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const section      = searchParams.get('section')

  // Only visible inside the editing workspace
  const isEditorContext =
    pathname.startsWith('/dashboard/store-editor') ||
    pathname === '/dashboard/products' ||
    pathname === '/dashboard/products/new' ||
    /^\/dashboard\/products\/.+$/.test(pathname)

  if (!isEditorContext) return null

  function isActive(id: string): boolean {
    switch (id) {
      case 'products':
        return (
          pathname === '/dashboard/products' ||
          (/^\/dashboard\/products\/.+$/.test(pathname) &&
            pathname !== '/dashboard/products/new')
        )
      case 'add':     return pathname === '/dashboard/products/new'
      case 'preview': return pathname.startsWith('/dashboard/store-editor') && section === 'preview'
      case 'design':  return pathname.startsWith('/dashboard/store-editor') && section === 'design'
      case 'profile': return pathname === '/dashboard/storefront'
      default:        return false
    }
  }

  return (
    // Fixed just above the main bottom nav (bottom-14 = 56px = height of nav)
    <div className="sm:hidden fixed bottom-14 left-0 right-0 z-30 bg-white border-t border-neutral-100 h-10 flex items-center px-2 gap-1 overflow-x-auto scrollbar-none">
      {EDITOR_ITEMS.map(({ id, href, label, Icon }) => {
        const active = isActive(id)
        return (
          <Link
            key={id}
            href={href}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap',
              active
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-500 hover:bg-neutral-100',
            )}
          >
            <Icon size={12} />
            {label}
          </Link>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Public export — Suspense for useSearchParams + usePathname
// ─────────────────────────────────────────────────────────────

export function MobileTopMiniNav() {
  return (
    <Suspense fallback={null}>
      <MobileEditorSubmenuInner />
    </Suspense>
  )
}
