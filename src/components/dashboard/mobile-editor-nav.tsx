'use client'
import { Suspense } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Package, Plus, Smartphone, Palette, User } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────
// Inner nav — reads pathname + searchParams to derive active state
// ─────────────────────────────────────────────────────────────

function MobileEditorNavInner() {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()
  const section     = searchParams.get('section')

  const isProductsList = pathname === '/dashboard/products'
  const isNewProduct   = pathname === '/dashboard/products/new'
  const isEditProduct  = /^\/dashboard\/products\/.+$/.test(pathname) && !isNewProduct
  const isStoreEditor  = pathname.startsWith('/dashboard/store-editor')

  // Active item derived purely from URL — single source of truth
  const active =
    isNewProduct                            ? 'add'      :
    (isProductsList || isEditProduct)       ? 'products' :
    isStoreEditor && section === 'preview'  ? 'preview'  :
    isStoreEditor && section === 'design'   ? 'design'   :
    isStoreEditor && section === 'profile'  ? 'profile'  :
                                              'products'  // store-editor default + fallback

  const items = [
    { id: 'products', label: 'Products', Icon: Package,    target: '/dashboard/products' },
    { id: 'add',      label: 'Add',      Icon: Plus,       target: '/dashboard/products/new', special: true },
    { id: 'preview',  label: 'Preview',  Icon: Smartphone, target: '/dashboard/store-editor?section=preview' },
    { id: 'design',   label: 'Design',   Icon: Palette,    target: '/dashboard/store-editor?section=design' },
    { id: 'profile',  label: 'Profile',  Icon: User,       target: '/dashboard/store-editor?section=profile' },
  ]

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 flex items-stretch h-14">
      {items.map(({ id, label, Icon, target, special }) => (
        <button
          key={id}
          onClick={() => router.push(target)}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
            active === id ? 'text-black' : 'text-neutral-400',
          )}
        >
          {special ? (
            <>
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center -mt-1">
                <Icon size={16} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-semibold">{label}</span>
            </>
          ) : (
            <>
              <Icon size={20} strokeWidth={active === id ? 2.5 : 1.75} />
              <span className="text-[10px] font-semibold">{label}</span>
            </>
          )}
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Public export — always safe to render; Suspense boundary
// contained here so callers need no extra wrapping
// ─────────────────────────────────────────────────────────────

export function MobileEditorNav() {
  return (
    <Suspense fallback={null}>
      <MobileEditorNavInner />
    </Suspense>
  )
}
