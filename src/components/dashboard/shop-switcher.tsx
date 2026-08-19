'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Loader2, Plus } from 'lucide-react'
import { cn, slugify } from '@/lib/utils'
import { slugFromText } from '@/lib/supabase/ensure-user-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { UserStoreSummary } from '@/lib/stores/types'

interface ShopSwitcherProps {
  stores: UserStoreSummary[]
  activeStoreId: string | null
  activeStore: UserStoreSummary | null
  switching: boolean
  isDemo: boolean
  onSwitch: (storeId: string) => Promise<boolean>
  onCreate: (input: { name: string; slug: string }) => Promise<{ ok: true } | { ok: false; error: string }>
  onClose?: () => void
}

function ShopAvatar({ store, size = 'md' }: { store: UserStoreSummary; size?: 'sm' | 'md' | 'lg' }) {
  const [imgError, setImgError] = useState(false)
  const sizeClass = size === 'lg' ? 'h-10 w-10 text-sm' : size === 'sm' ? 'h-7 w-7 text-xs' : 'h-8 w-8 text-xs'
  const initial = (store.name.charAt(0) || 'S').toUpperCase()

  if (store.avatar_url && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={store.avatar_url}
        alt={store.name}
        className={cn(sizeClass, 'rounded-full object-cover flex-shrink-0')}
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div className={cn(sizeClass, 'rounded-full bg-neutral-900 flex items-center justify-center text-white font-bold flex-shrink-0')}>
      {initial}
    </div>
  )
}

export function ShopSwitcher({
  stores,
  activeStoreId,
  activeStore,
  switching,
  isDemo,
  onSwitch,
  onCreate,
  onClose,
}: ShopSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [shopName, setShopName] = useState('')
  const [shopSlug, setShopSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  useEffect(() => {
    if (!slugTouched && shopName) {
      setShopSlug(slugFromText(shopName))
    }
  }, [shopName, slugTouched])

  async function handleSwitch(storeId: string) {
    if (storeId === activeStoreId || switching) return
    const ok = await onSwitch(storeId)
    if (ok) {
      setOpen(false)
      onClose?.()
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (creating) return
    setCreating(true)
    setCreateError(null)
    const result = await onCreate({ name: shopName.trim(), slug: slugify(shopSlug.trim()) })
    setCreating(false)
    if (result.ok) {
      setModalOpen(false)
      setOpen(false)
      setShopName('')
      setShopSlug('')
      setSlugTouched(false)
      onClose?.()
    } else {
      setCreateError(result.error)
    }
  }

  const display = activeStore ?? stores[0] ?? null

  if (!display && stores.length === 0) return null

  return (
    <>
      <div ref={containerRef} className="relative px-4 pt-5 pb-4 border-b border-neutral-100">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          disabled={switching}
          className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-neutral-300 hover:bg-neutral-50 disabled:opacity-60"
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          {display && <ShopAvatar store={display} size="lg" />}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-neutral-900">
              {display?.name ?? 'Your Shop'}
            </p>
            {display?.slug && (
              <p className="truncate text-[11px] text-neutral-400">@{display.slug}</p>
            )}
          </div>
          {switching ? (
            <Loader2 size={16} className="animate-spin text-neutral-400 flex-shrink-0" />
          ) : (
            <ChevronDown size={16} className={cn('text-neutral-400 flex-shrink-0 transition-transform', open && 'rotate-180')} />
          )}
        </button>

        {open && (
          <div className="absolute left-4 right-4 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
            <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
              Your Shops
            </p>
            {stores.map(shop => {
              const isActive = shop.id === activeStoreId
              return (
                <button
                  key={shop.id}
                  type="button"
                  onClick={() => handleSwitch(shop.id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-50',
                    isActive && 'bg-neutral-50',
                  )}
                >
                  <ShopAvatar store={shop} />
                  <span className="min-w-0 flex-1 truncate font-medium text-neutral-900">{shop.name}</span>
                  {isActive && <Check size={14} className="flex-shrink-0 text-[#00E676]" />}
                </button>
              )
            })}
            {!isDemo && (
              <>
                <div className="my-1 border-t border-neutral-100" />
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(true)
                    setCreateError(null)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                >
                  <Plus size={14} className="text-neutral-500" />
                  Create New Shop
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-neutral-900">Create New Shop</h2>
            <p className="mt-1 text-sm text-neutral-500">Add another business under your SellBop account.</p>
            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">Shop Name</label>
                <Input
                  value={shopName}
                  onChange={e => setShopName(e.target.value)}
                  placeholder="PDF Lab"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">Shop URL</label>
                <div className="flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm">
                  <span className="text-neutral-400">sellbop.com/</span>
                  <input
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    value={shopSlug}
                    onChange={e => {
                      setSlugTouched(true)
                      setShopSlug(slugFromText(e.target.value))
                    }}
                    placeholder="pdf-lab"
                    required
                  />
                </div>
              </div>
              {createError && (
                <p className="text-sm text-red-600">{createError}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating || !shopName.trim() || !shopSlug.trim()}>
                  {creating ? <Loader2 size={16} className="animate-spin" /> : 'Create Shop'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
