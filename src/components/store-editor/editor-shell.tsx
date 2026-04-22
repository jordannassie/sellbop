'use client'
import React, { useState } from 'react'
import {
  ExternalLink, Copy, Check, CloudUpload,
  Star, Eye, EyeOff, Pencil, Plus, Lock, Package, Zap, Shirt,
  Image, Video, Ban, X, Layers,
} from 'lucide-react'
import Link from 'next/link'
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  arrayMove, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { ProductImage } from '@/components/ui/product-image'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useStoreEditor } from '@/context/store-editor-context'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { toast } from 'sonner'
import type { Storefront, Product, HeaderMediaType } from '@/lib/domain/entities'

// ─────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────

type EditorTab = 'products' | 'layout' | 'theme' | 'profile'

const TABS: { id: EditorTab; label: string }[] = [
  { id: 'products', label: 'Products' },
  { id: 'layout',   label: 'Layout' },
  { id: 'theme',    label: 'Theme' },
  { id: 'profile',  label: 'Profile' },
]

const TAB_DESCRIPTIONS: Record<EditorTab, string> = {
  products: 'Arrange what appears on your store — featured, order, and visibility',
  layout:   'Control which sections appear on your store',
  theme:    'Pick the look and feel of your store',
  profile:  'Your store identity is managed in Store Profile',
}

const SECTION_META: Record<string, { label: string; description: string; locked?: boolean; color: string }> = {
  header:       { label: 'Header',            description: 'Name · bio · avatar · socials',  locked: true, color: 'bg-neutral-700' },
  featured:     { label: 'Featured Products', description: 'Up to 3 highlighted products',             color: 'bg-amber-500' },
  all_products: { label: 'All Products',      description: 'Full product catalog',                     color: 'bg-blue-500' },
  about:        { label: 'About',             description: 'Longer bio section',                       color: 'bg-violet-500' },
  links:        { label: 'Links',             description: 'Social & external links',                  color: 'bg-teal-500' },
  testimonials: { label: 'Testimonials',      description: 'Social proof',                             color: 'bg-rose-400' },
  faq:          { label: 'FAQ',               description: 'Frequently asked questions',               color: 'bg-orange-400' },
}

const TYPE_LABELS: Record<string, string> = {
  digital_download: 'Digital', service_offer: 'Service',
  subscription: 'Subscription', bundle: 'Bundle', membership_ready: 'Membership',
}

const ACCENT_PRESETS = [
  { color: '#000000', label: 'Black' },
  { color: '#1a1a2e', label: 'Navy' },
  { color: '#7c3aed', label: 'Violet' },
  { color: '#0f766e', label: 'Teal' },
  { color: '#dc2626', label: 'Red' },
  { color: '#d97706', label: 'Amber' },
  { color: '#1d4ed8', label: 'Blue' },
  { color: '#16a34a', label: 'Green' },
]

type ThemePreset = { label: string; patch: Partial<Storefront> }
const THEME_PRESETS: ThemePreset[] = [
  { label: 'Minimal',      patch: { themeColor: '#000000', buttonStyle: 'rounded',      cardStyle: 'minimal',     headerLayout: 'left_avatar', cardDensity: 'comfortable' } },
  { label: 'Creator',      patch: { themeColor: '#7c3aed', buttonStyle: 'soft_rounded', cardStyle: 'soft_shadow', headerLayout: 'left_avatar', cardDensity: 'comfortable' } },
  { label: 'Coaching',     patch: { themeColor: '#0f766e', buttonStyle: 'rounded',      cardStyle: 'soft_shadow', headerLayout: 'centered',    cardDensity: 'large'       } },
  { label: 'Digital Shop', patch: { themeColor: '#1d4ed8', buttonStyle: 'square',       cardStyle: 'outline',     headerLayout: 'left_avatar', cardDensity: 'compact'     } },
]

// ─────────────────────────────────────────────────────────────
// Drag handle SVG
// ─────────────────────────────────────────────────────────────

function GripDots() {
  return (
    <svg width="10" height="18" viewBox="0 0 10 18" fill="currentColor" aria-hidden="true">
      {([0, 5, 10, 15] as number[]).map(y =>
        ([0, 5] as number[]).map(x => (
          <circle key={`${x}-${y}`} cx={x + 2} cy={y + 2} r="1.75" />
        ))
      )}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// Theme control components (OptionPills, ColorPicker, Toggle)
// ─────────────────────────────────────────────────────────────

function OptionPills<T extends string>({ value, options, onChange }: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'text-sm px-3.5 py-1.5 rounded-xl border transition-colors font-medium',
            value === o.value
              ? 'bg-black text-white border-black'
              : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2.5">
        {ACCENT_PRESETS.map(p => (
          <button
            key={p.color}
            title={p.label}
            onClick={() => onChange(p.color)}
            className={cn(
              'w-7 h-7 rounded-full border-2 transition-transform hover:scale-110',
              value === p.color ? 'border-neutral-900 scale-110' : 'border-transparent',
            )}
            style={{ backgroundColor: p.color }}
          />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-9 h-8 rounded-lg border border-neutral-200 cursor-pointer p-0.5 bg-white"
        />
        <span className="text-xs text-neutral-400 font-mono">{value}</span>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors',
        checked ? 'bg-black' : 'bg-neutral-200',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0',
        )}
      />
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// Sortable product row (Products tab)
// ─────────────────────────────────────────────────────────────

function SortableProductRow({ product, isFeatured, onToggleFeatured, onToggleHidden, isHidden, canFeature }: {
  product: Product
  isFeatured: boolean
  onToggleFeatured: () => void
  onToggleHidden: () => void
  isHidden: boolean
  canFeature: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const isLive = product.status === 'published'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'flex items-center rounded-xl bg-white border transition-all duration-150 overflow-hidden',
        isDragging
          ? 'shadow-2xl border-black/10 scale-[1.02] z-50'
          : 'border-neutral-200 hover:border-neutral-300 hover:shadow-sm',
        isHidden && !isDragging && 'opacity-50',
      )}
    >
      {/* Drag strip */}
      <span
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none flex items-center justify-center w-9 self-stretch bg-neutral-50 hover:bg-neutral-100 border-r border-neutral-100 transition-colors text-neutral-300 hover:text-neutral-500 flex-shrink-0"
        title="Drag to reorder"
      >
        <GripDots />
      </span>

      {/* Thumbnail — fixed size, overflow hidden, relative required for fill images */}
      <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100 my-2.5 ml-2.5">
        {product.thumbnailUrl && product.source === 'printify' ? (
          <img src={product.thumbnailUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <ProductImage src={product.thumbnailUrl} alt={product.name} productType={product.productType} fill iconSize="sm" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 px-2.5 py-2.5">
        <p className={cn('text-xs font-bold leading-tight truncate', isHidden ? 'text-neutral-400' : 'text-black')}>
          {product.name}
        </p>
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          {isLive ? (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full">
              <span className="w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" /> Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
              <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" /> Draft
            </span>
          )}
          {product.source === 'printify' ? (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-violet-50 text-violet-600 border border-violet-200 px-1.5 py-0.5 rounded-full">
              <Zap size={7} /> Printify
            </span>
          ) : (
            <span className="text-[9px] text-neutral-400 font-semibold">{TYPE_LABELS[product.productType]}</span>
          )}
          <span className="text-[9px] text-neutral-500 font-bold">{formatCurrency(product.price, product.currency)}</span>
          {isFeatured && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-300 px-1.5 py-0.5 rounded-full">
              <Star size={7} fill="currentColor" /> Featured
            </span>
          )}
          {isHidden && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-neutral-100 text-neutral-500 border border-neutral-200 px-1.5 py-0.5 rounded-full">
              <EyeOff size={7} /> Hidden
            </span>
          )}
        </div>
      </div>

      {/* Actions: Feature · Hide · Edit */}
      <div className="flex items-center gap-0.5 pr-2 flex-shrink-0">
        <button
          onClick={onToggleFeatured}
          disabled={!canFeature && !isFeatured}
          title={isFeatured ? 'Remove from featured' : canFeature ? 'Add to featured' : 'Max 3 featured'}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded-lg transition-all',
            isFeatured
              ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
              : 'text-neutral-300 hover:text-amber-500 hover:bg-amber-50',
            !canFeature && !isFeatured && 'opacity-25 cursor-not-allowed pointer-events-none',
          )}
        >
          <Star size={13} fill={isFeatured ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>
        <button
          onClick={onToggleHidden}
          title={isHidden ? 'Add to Store' : 'Hide from Store'}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded-lg transition-all',
            isHidden
              ? 'text-neutral-500 bg-neutral-100 hover:bg-neutral-200'
              : 'text-neutral-300 hover:text-neutral-600 hover:bg-neutral-100',
          )}
        >
          {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
        {product.source === 'printify' ? (
          <Link
            href="/dashboard/printify"
            title="Managed in Printify"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-300 hover:text-violet-600 hover:bg-violet-50 transition-all"
          >
            <Shirt size={11} />
          </Link>
        ) : (
          <Link
            href={`/dashboard/products/${product.id}`}
            title="Edit product"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-300 hover:text-neutral-700 hover:bg-neutral-100 transition-all"
          >
            <Pencil size={11} />
          </Link>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Available product row (non-draggable; products not on store)
// ─────────────────────────────────────────────────────────────

function AvailableProductRow({ product, onAddToStore, onAddToFeatured, canFeature }: {
  product: Product
  onAddToStore: () => void
  onAddToFeatured: () => void
  canFeature: boolean
}) {
  const isLive      = product.status === 'published'
  const isPrintify  = product.source === 'printify'

  return (
    <div className="flex items-center rounded-xl bg-neutral-50 border border-neutral-200 border-dashed hover:border-neutral-300 hover:bg-white hover:shadow-sm transition-all duration-150 overflow-hidden">
      {/* Thumbnail — fixed size, overflow hidden, relative required for fill images */}
      <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100 my-2.5 ml-3 mr-0.5">
        {product.thumbnailUrl && isPrintify ? (
          <img src={product.thumbnailUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <ProductImage src={product.thumbnailUrl} alt={product.name} productType={product.productType} fill iconSize="sm" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 px-2.5 py-2.5">
        <p className="text-xs font-bold leading-tight truncate text-neutral-600">{product.name}</p>
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          {isLive ? (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full">
              <span className="w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" /> Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
              <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" /> Draft
            </span>
          )}
          {isPrintify ? (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-violet-50 text-violet-600 border border-violet-200 px-1.5 py-0.5 rounded-full">
              <Zap size={7} /> Printify · Clothing
            </span>
          ) : (
            <span className="text-[9px] text-neutral-400 font-semibold">{TYPE_LABELS[product.productType]}</span>
          )}
          <span className="text-[9px] text-neutral-500 font-bold">{formatCurrency(product.price, product.currency)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 pr-3 flex-shrink-0">
        <button
          onClick={onAddToStore}
          className="flex items-center gap-1 h-7 px-2 rounded-lg text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors whitespace-nowrap"
        >
          <Eye size={9} /> Add to Store
        </button>
        <button
          onClick={onAddToFeatured}
          disabled={!canFeature}
          title={canFeature ? 'Add to Featured' : 'Max 3 featured products'}
          className="flex items-center gap-1 h-7 px-2 rounded-lg text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Star size={9} fill="currentColor" /> Feature
        </button>
        {isPrintify ? (
          <Link
            href="/dashboard/printify"
            title="Managed in Printify"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-300 hover:text-violet-600 hover:bg-violet-50 transition-all"
          >
            <Shirt size={11} />
          </Link>
        ) : (
          <Link
            href={`/dashboard/products/${product.id}`}
            title="Edit Product"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-300 hover:text-neutral-700 hover:bg-neutral-100 transition-all"
          >
            <Pencil size={11} />
          </Link>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Sortable section item (Layout tab)
// ─────────────────────────────────────────────────────────────

function SortableSectionItem({ id }: { id: string }) {
  const { config, update } = useStoreEditor()
  const meta = SECTION_META[id]

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: meta?.locked ?? false,
  })

  const isVisible = config.sectionVisibility[id] ?? false
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className={cn(
        'flex items-center bg-white border rounded-xl overflow-hidden transition-all duration-150',
        isDragging
          ? 'shadow-2xl border-neutral-400 scale-[1.01]'
          : 'border-neutral-200 hover:border-neutral-300 hover:shadow-sm',
        !isVisible && !isDragging && 'opacity-50',
      )}>
        {/* Drag strip */}
        <span
          {...(meta?.locked ? {} : listeners)}
          className={cn(
            'flex items-center justify-center w-9 self-stretch border-r border-neutral-100 flex-shrink-0 transition-colors',
            meta?.locked
              ? 'bg-neutral-50 cursor-not-allowed'
              : 'bg-neutral-50 hover:bg-neutral-100 cursor-grab active:cursor-grabbing touch-none text-neutral-300 hover:text-neutral-500',
          )}
          title={meta?.locked ? 'Header cannot be reordered' : 'Drag to reorder'}
        >
          {meta?.locked
            ? <Lock size={11} className="text-neutral-200" />
            : <GripDots />
          }
        </span>

        {/* Color dot */}
        <div className={cn('w-2 h-2 rounded-full flex-shrink-0 ml-3', meta?.color)} />

        {/* Info */}
        <div className="flex-1 min-w-0 px-2.5 py-3.5">
          <p className={cn('text-xs font-semibold', isVisible ? 'text-black' : 'text-neutral-400')}>
            {meta?.label}
          </p>
          <p className="text-[10px] text-neutral-400 leading-snug mt-0.5">{meta?.description}</p>
        </div>

        {/* Toggle */}
        <div className="pr-3 flex-shrink-0">
          {meta?.locked ? (
            <span className="text-[9px] font-bold text-neutral-300 px-2 py-0.5 rounded-full border border-neutral-100 bg-neutral-50">
              Always on
            </span>
          ) : (
            <Toggle
              checked={isVisible}
              onChange={v => update({ sectionVisibility: { ...config.sectionVisibility, [id]: v } })}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Tab: Profile
// ─────────────────────────────────────────────────────────────

function ProfileTab() {
  const { config } = useStoreEditor()

  const socialCount = [
    config.socialLinks.twitter,
    config.socialLinks.instagram,
    config.socialLinks.youtube,
    config.socialLinks.website,
  ].filter(Boolean).length

  return (
    <div className="max-w-2xl mx-auto px-5 py-4 sm:py-8 space-y-4">

      {/* Identity preview card */}
      <Card>
        <CardContent className="pt-6">
          {/* Avatar + name row */}
          <div className="flex items-center gap-4 mb-5">
            <div
              className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-2xl font-black shadow-sm"
              style={{ backgroundColor: config.themeColor }}
            >
              {config.title.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-black leading-tight truncate">
                {config.title}
              </p>
              {config.headline ? (
                <p className="text-sm text-neutral-500 mt-0.5 truncate">{config.headline}</p>
              ) : (
                <p className="text-sm text-neutral-300 mt-0.5 italic">No headline set</p>
              )}
              {config.bio ? (
                <p className="text-xs text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed">{config.bio}</p>
              ) : (
                <p className="text-xs text-neutral-300 mt-1.5 italic">No bio set</p>
              )}
            </div>
          </div>

          {/* Social link count */}
          <p className="text-xs text-neutral-400 mb-4">
            {socialCount > 0 ? `${socialCount} social link${socialCount > 1 ? 's' : ''} connected` : 'No social links connected'}
          </p>

          {/* CTA */}
          <Link
            href="/dashboard/storefront"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold bg-black text-white hover:bg-neutral-800 transition-colors"
          >
            Edit Store Profile
          </Link>
        </CardContent>
      </Card>

      {/* Helper note */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <p className="text-sm font-semibold text-black mb-1">Profile is managed in Store Profile</p>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Your store name, photo, headline, bio, and social links are all managed from the{' '}
            <Link href="/dashboard/storefront" className="font-semibold text-black underline underline-offset-2">
              Store Profile
            </Link>{' '}
            page. Use the tabs below to arrange products, adjust layout, and customise your theme.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Tab: Products
// ─────────────────────────────────────────────────────────────

function ProductsTab() {
  const { config, update, products } = useStoreEditor()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // ── Computed groups ───────────────────────────────────────────
  const orderMap        = new Map(config.productOrder.map((pid, i) => [pid, i]))
  const productOrderSet = new Set(config.productOrder)
  const allSorted       = [...products].sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999))

  const featuredProducts = config.featuredProductIds
    .map(fid => products.find(p => p.id === fid))
    .filter(Boolean) as Product[]

  // "On store"  = explicitly in productOrder AND not in hiddenProductIds
  const storeProducts     = allSorted.filter(p =>
    productOrderSet.has(p.id) && !config.hiddenProductIds.includes(p.id),
  )
  // "Available" = explicitly hidden OR never added to productOrder (newly synced Printify, etc.)
  const availableProducts = allSorted.filter(p =>
    config.hiddenProductIds.includes(p.id) || !productOrderSet.has(p.id),
  )

  const storeProductIds = storeProducts.map(p => p.id)
  const canFeature      = config.featuredProductIds.length < 3

  // ── Actions ───────────────────────────────────────────────────

  function handleFeaturedDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = config.featuredProductIds
    update({ featuredProductIds: arrayMove(ids, ids.indexOf(active.id as string), ids.indexOf(over.id as string)) })
  }

  function handleStoreDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const newStoreOrder = arrayMove(storeProductIds, storeProductIds.indexOf(active.id as string), storeProductIds.indexOf(over.id as string))
    // Hidden products preserve their slot in productOrder; untracked products stay untracked
    const hiddenInOrder = config.productOrder.filter(id => config.hiddenProductIds.includes(id))
    update({ productOrder: [...newStoreOrder, ...hiddenInOrder] })
  }

  function toggleFeatured(productId: string) {
    const cur = config.featuredProductIds
    update({
      featuredProductIds: cur.includes(productId)
        ? cur.filter(id => id !== productId)
        : cur.length < 3 ? [...cur, productId] : cur,
    })
  }

  function hideFromStore(productId: string) {
    // Remove from featured too — hidden products can't be featured
    update({
      hiddenProductIds:   [...config.hiddenProductIds, productId],
      featuredProductIds: config.featuredProductIds.filter(id => id !== productId),
    })
  }

  function addToStore(productId: string) {
    const newHidden = config.hiddenProductIds.filter(id => id !== productId)
    // If not yet in productOrder (newly synced), append it
    const newOrder = productOrderSet.has(productId)
      ? config.productOrder  // already in order, just unhide
      : [...config.productOrder, productId]
    update({ hiddenProductIds: newHidden, productOrder: newOrder })
  }

  function addToFeatured(productId: string) {
    if (config.featuredProductIds.length >= 3) return
    const newHidden = config.hiddenProductIds.filter(id => id !== productId)
    const newOrder  = productOrderSet.has(productId)
      ? config.productOrder
      : [...config.productOrder, productId]
    update({
      featuredProductIds: [...config.featuredProductIds, productId],
      hiddenProductIds:   newHidden,
      productOrder:       newOrder,
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-4 sm:py-8 space-y-5">

      {/* ── Page action bar ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-black">Store Products</p>
          <p className="text-xs text-neutral-500 mt-0.5">Manage what appears on your public store</p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-black text-white hover:bg-neutral-800 transition-colors"
        >
          <Plus size={12} /> Create New Product
        </Link>
      </div>

      {/* ── 1. FEATURED PRODUCTS ────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star size={13} className="text-amber-500" fill="currentColor" />
            <CardTitle>Featured Products</CardTitle>
          </div>
          <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
            {config.featuredProductIds.length} / 3 slots
          </span>
        </CardHeader>
        <CardContent>
          <p className="text-[11px] text-neutral-400 mb-3 leading-relaxed">
            Highlighted at the top of your store. Drag to reorder. Use <Star size={9} className="inline text-amber-500" fill="currentColor" /> on store products below to add them here.
          </p>
          {featuredProducts.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                <Star size={14} className="text-amber-400" />
              </div>
              <p className="text-sm font-semibold text-neutral-600">No featured products yet</p>
              <p className="text-xs text-neutral-400">Click <Star size={9} className="inline text-amber-500" fill="currentColor" /> on a store product below to feature it.</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFeaturedDragEnd}>
              <SortableContext items={config.featuredProductIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {featuredProducts.map(p => (
                    <SortableProductRow
                      key={p.id}
                      product={p}
                      isFeatured
                      onToggleFeatured={() => toggleFeatured(p.id)}
                      onToggleHidden={() => hideFromStore(p.id)}
                      isHidden={false}
                      canFeature={canFeature}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* ── 2. STORE PRODUCTS ───────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Eye size={13} className="text-blue-500" />
            <CardTitle>Store Products</CardTitle>
          </div>
          <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
            {storeProducts.length} visible
          </span>
        </CardHeader>
        <CardContent>
          <p className="text-[11px] text-neutral-400 mb-3 leading-relaxed">
            Drag to reorder. These products are visible on your public store page.
          </p>
          {storeProducts.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Package size={14} className="text-blue-400" />
              </div>
              <p className="text-sm font-semibold text-neutral-600">No products on your store yet</p>
              <p className="text-xs text-neutral-400">Add products from below, or create a new one.</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleStoreDragEnd}>
              <SortableContext items={storeProductIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {storeProducts.map(p => (
                    <SortableProductRow
                      key={p.id}
                      product={p}
                      isFeatured={config.featuredProductIds.includes(p.id)}
                      onToggleFeatured={() => toggleFeatured(p.id)}
                      onToggleHidden={() => hideFromStore(p.id)}
                      isHidden={false}
                      canFeature={canFeature}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* ── 3. AVAILABLE PRODUCTS (hidden / not on store) ───── */}
      {(availableProducts.length > 0 || products.length === 0) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <EyeOff size={13} className="text-neutral-400" />
              <CardTitle>Available Products</CardTitle>
            </div>
            {availableProducts.length > 0 && (
              <span className="text-[11px] font-semibold text-neutral-500 bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-full">
                {availableProducts.length} not on store
              </span>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-neutral-400 mb-3 leading-relaxed">
              Products in your account that are not currently on your store — including newly synced Printify clothing.
              Click <strong className="text-neutral-600">Add to Store</strong> or <strong className="text-neutral-600">Add to Featured</strong> to make them visible.
            </p>
            {availableProducts.length === 0 && products.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-center">
                  <Package size={14} className="text-neutral-400" />
                </div>
                <p className="text-sm font-semibold text-neutral-600">No products yet</p>
                <Link href="/dashboard/products/new" className="text-xs text-black font-semibold underline underline-offset-2 mt-0.5 inline-block">
                  Create your first product →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {availableProducts.map(p => (
                  <AvailableProductRow
                    key={p.id}
                    product={p}
                    onAddToStore={() => addToStore(p.id)}
                    onAddToFeatured={() => addToFeatured(p.id)}
                    canFeature={canFeature}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Header Media card (used inside LayoutTab)
// ─────────────────────────────────────────────────────────────

const MEDIA_OPTIONS: { id: HeaderMediaType; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'none',  label: 'None',  icon: <Ban size={16} />,   desc: 'Clean header only' },
  { id: 'photo', label: 'Photo', icon: <Image size={16} />, desc: 'Banner image'       },
  { id: 'video', label: 'Video', icon: <Video size={16} />, desc: 'Embedded video'     },
]

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('?')[0]
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v')
  } catch { /* invalid URL */ }
  return null
}

function HeaderMediaCard() {
  const { config, update } = useStoreEditor()
  const media     = config.headerMedia ?? 'none'
  const photoUrl  = config.headerPhotoUrl ?? ''
  const videoUrl  = config.headerVideoUrl ?? ''

  const [localPhoto, setLocalPhoto] = useState(photoUrl)
  const [localVideo, setLocalVideo] = useState(videoUrl)

  function commitPhoto() {
    update({ headerPhotoUrl: localPhoto.trim() || null })
  }
  function commitVideo() {
    update({ headerVideoUrl: localVideo.trim() || null })
  }

  const ytId = getYouTubeId(localVideo)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Header Media</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-neutral-500">
          Add a banner photo or video below your store header, or keep it clean with None.
        </p>

        {/* Segmented option picker */}
        <div className="grid grid-cols-3 gap-2">
          {MEDIA_OPTIONS.map(opt => {
            const active = media === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => update({ headerMedia: opt.id })}
                className={[
                  'rounded-xl border-2 p-3 text-left transition-all',
                  active
                    ? 'border-black bg-neutral-50'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white',
                ].join(' ')}
              >
                <div className={['mb-2', active ? 'text-black' : 'text-neutral-400'].join(' ')}>
                  {opt.icon}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-black">{opt.label}</span>
                  {active && (
                    <span className="w-4 h-4 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                      <Check size={9} className="text-white" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">{opt.desc}</p>
              </button>
            )
          })}
        </div>

        {/* Photo inputs */}
        {media === 'photo' && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-black">Banner Image URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={localPhoto}
                onChange={e => setLocalPhoto(e.target.value)}
                onBlur={commitPhoto}
                placeholder="https://example.com/banner.jpg"
                className="flex-1 h-10 rounded-xl border border-neutral-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              />
              {localPhoto && (
                <button
                  onClick={() => { setLocalPhoto(''); update({ headerPhotoUrl: null }) }}
                  className="w-10 h-10 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-red-500 hover:border-red-200 transition-colors"
                  title="Remove"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {localPhoto && (
              <div className="rounded-xl overflow-hidden border border-neutral-100 bg-neutral-50 aspect-[3/1]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={localPhoto}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            )}
            <p className="text-[11px] text-neutral-400">Paste a direct image URL. Recommended ratio: 3:1 (e.g. 1200×400).</p>
          </div>
        )}

        {/* Video inputs */}
        {media === 'video' && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-black">Video URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={localVideo}
                onChange={e => setLocalVideo(e.target.value)}
                onBlur={commitVideo}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 h-10 rounded-xl border border-neutral-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              />
              {localVideo && (
                <button
                  onClick={() => { setLocalVideo(''); update({ headerVideoUrl: null }) }}
                  className="w-10 h-10 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-red-500 hover:border-red-200 transition-colors"
                  title="Remove"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {localVideo && ytId && (
              <div className="rounded-xl overflow-hidden border border-neutral-100 bg-black aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}`}
                  title="Video preview"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            )}
            {localVideo && !ytId && (
              <p className="text-[11px] text-amber-600">Only YouTube links are supported right now. Paste a YouTube URL above.</p>
            )}
            <p className="text-[11px] text-neutral-400">Paste a YouTube link. It will appear as an embedded video on your store.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────
// Tab: Layout
// ─────────────────────────────────────────────────────────────

function LayoutTab() {
  const { config, update } = useStoreEditor()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id || active.id === 'header') return
    const oldIndex = config.sectionOrder.indexOf(active.id as string)
    const newIndex = Math.max(1, config.sectionOrder.indexOf(over.id as string))
    update({ sectionOrder: arrayMove(config.sectionOrder, oldIndex, newIndex) })
  }

  const isSide   = config.headerLayout !== 'centered'
  const isCenter = config.headerLayout === 'centered'

  return (
    <div className="max-w-2xl mx-auto px-5 py-4 sm:py-8 space-y-5">

      {/* ── Header Layout ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Header Layout</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500 mb-4">
            Choose how your store header is arranged.
          </p>
          <div className="grid grid-cols-2 gap-3">

            {/* Side option */}
            <button
              onClick={() => update({ headerLayout: 'left_avatar' })}
              className={[
                'rounded-xl border-2 p-3 text-left transition-all',
                isSide
                  ? 'border-black bg-neutral-50'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white',
              ].join(' ')}
            >
              {/* Mini preview */}
              <div className="bg-white rounded-lg border border-neutral-100 p-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-neutral-800 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="w-3/4 h-1.5 bg-neutral-800 rounded-full" />
                    <div className="w-1/2 h-1 bg-neutral-300 rounded-full" />
                  </div>
                </div>
                <div className="flex gap-1 mt-2">
                  <div className="h-3 w-8 bg-neutral-100 border border-neutral-200 rounded-full" />
                  <div className="h-3 w-8 bg-neutral-100 border border-neutral-200 rounded-full" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-black">Side</span>
                {isSide && (
                  <span className="w-4 h-4 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    <Check size={9} className="text-white" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">Avatar left, info right</p>
            </button>

            {/* Center option */}
            <button
              onClick={() => update({ headerLayout: 'centered' })}
              className={[
                'rounded-xl border-2 p-3 text-left transition-all',
                isCenter
                  ? 'border-black bg-neutral-50'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white',
              ].join(' ')}
            >
              {/* Mini preview */}
              <div className="bg-white rounded-lg border border-neutral-100 p-2.5 mb-3">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-7 h-7 rounded-lg bg-neutral-800" />
                  <div className="w-2/3 h-1.5 bg-neutral-800 rounded-full" />
                  <div className="w-1/2 h-1 bg-neutral-300 rounded-full" />
                  <div className="flex gap-1 mt-0.5">
                    <div className="h-3 w-6 bg-neutral-100 border border-neutral-200 rounded-full" />
                    <div className="h-3 w-6 bg-neutral-100 border border-neutral-200 rounded-full" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-black">Center</span>
                {isCenter && (
                  <span className="w-4 h-4 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    <Check size={9} className="text-white" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">Avatar and info centered</p>
            </button>

          </div>
        </CardContent>
      </Card>

      {/* ── Header Media ─────────────────────────────────────── */}
      <HeaderMediaCard />

      {/* ── Section order / visibility ───────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Store Sections</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500 mb-5">
            Drag sections to reorder them. Toggle to show or hide each section on your store.
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
            <SortableContext items={config.sectionOrder} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {config.sectionOrder.map(id => (
                  <SortableSectionItem key={id} id={id} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Tab: Theme
// ─────────────────────────────────────────────────────────────

function ThemeTab() {
  const { config, update } = useStoreEditor()

  return (
    <div className="max-w-2xl mx-auto px-5 py-4 sm:py-8 space-y-5">
      {/* Appearance card: presets + color */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium text-neutral-700 mb-3">Theme Preset</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {THEME_PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => update(p.patch)}
                  className="text-sm border border-neutral-200 rounded-lg py-2 px-3 text-center font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-neutral-100 pt-6">
            <p className="text-sm font-medium text-neutral-700 mb-3">Accent Color</p>
            <ColorPicker value={config.themeColor} onChange={v => update({ themeColor: v })} />
          </div>
        </CardContent>
      </Card>

      {/* Style card: button + card + header + density */}
      <Card>
        <CardHeader>
          <CardTitle>Style Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium text-neutral-700 mb-3">Button Style</p>
            <OptionPills
              value={config.buttonStyle}
              onChange={v => update({ buttonStyle: v })}
              options={[
                { value: 'rounded',      label: 'Rounded' },
                { value: 'soft_rounded', label: 'Pill'    },
                { value: 'square',       label: 'Square'  },
              ]}
            />
          </div>
          <div className="border-t border-neutral-100 pt-6">
            <p className="text-sm font-medium text-neutral-700 mb-3">Card Style</p>
            <OptionPills
              value={config.cardStyle}
              onChange={v => update({ cardStyle: v })}
              options={[
                { value: 'minimal',     label: 'Minimal' },
                { value: 'soft_shadow', label: 'Shadow'  },
                { value: 'outline',     label: 'Outline' },
              ]}
            />
          </div>
          <div className="border-t border-neutral-100 pt-6">
            <p className="text-sm font-medium text-neutral-700 mb-3">Card Density</p>
            <OptionPills
              value={config.cardDensity}
              onChange={v => update({ cardDensity: v })}
              options={[
                { value: 'compact',     label: 'Compact' },
                { value: 'comfortable', label: 'Comfy'   },
                { value: 'large',       label: 'Large'   },
              ]}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Top header bar (+ mobile action strip)
// ─────────────────────────────────────────────────────────────

function EditorTopBar() {
  const { config, isDirty, isSaving, saveChanges } = useStoreEditor()
  const [copied, setCopied] = useState(false)
  const storeUrl = `/store/${DEMO_SELLER_PROFILE.slug}`

  function copyLink() {
    const url = typeof window !== 'undefined' ? window.location.origin + storeUrl : storeUrl
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      toast.success('Link copied!')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
      {/* ── Main header row ────────────────────────────────────── */}
      <div className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-4 shrink-0">
        {/* Left: store avatar chip + title + dirty badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Store identity chip — rounded-square avatar + store name */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-black select-none"
              style={{ backgroundColor: config.themeColor }}
            >
              {config.title.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-bold text-black tracking-tight leading-none hidden sm:inline truncate max-w-[120px]">
              {config.title}
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-neutral-200 flex-shrink-0" />

          {/* Editor label */}
          <div>
            <p className="text-[11px] font-semibold text-neutral-500 leading-none">Store Editor</p>
          </div>

          {isDirty && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
              <span className="hidden sm:inline">Unsaved changes</span>
              <span className="sm:hidden">Unsaved</span>
            </div>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* Copy Link — desktop only */}
          <button
            onClick={copyLink}
            title="Copy public link"
            className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-neutral-600 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>

          {/* Open Store — desktop only */}
          <Link
            href={storeUrl}
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-neutral-600 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
          >
            <ExternalLink size={12} />
            Open Store
          </Link>

          {/* Save Changes — desktop only; mobile uses sticky bottom bar */}
          <button
            onClick={saveChanges}
            disabled={!isDirty || isSaving}
            className={cn(
              'hidden sm:flex items-center gap-1.5 h-8 px-3 sm:px-4 rounded-lg text-xs font-bold transition-all duration-150',
              isDirty && !isSaving
                ? 'bg-black text-white hover:bg-neutral-800 shadow-sm ring-1 ring-black/20'
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed',
            )}
          >
            <CloudUpload size={13} />
            <span>{isSaving ? 'Saving…' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* ── Mobile action strip (sm:hidden) ───────────────────── */}
      {/* Shows public URL + copy + open store for mobile users   */}
      <div className="sm:hidden bg-white border-b border-neutral-100 px-4 py-2 shrink-0">
        <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2">
          {/* URL label + value */}
          <span className="text-[10px] font-semibold text-neutral-400 flex-shrink-0 uppercase tracking-wide">URL</span>
          <span className="flex-1 text-[11px] text-neutral-700 font-medium truncate min-w-0">
            /store/{DEMO_SELLER_PROFILE.slug}
          </span>
          {/* Copy icon */}
          <button
            onClick={copyLink}
            title="Copy link"
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
          >
            {copied
              ? <Check size={13} className="text-emerald-500" />
              : <Copy size={13} />
            }
          </button>
          {/* Divider */}
          <div className="w-px h-4 bg-neutral-200 flex-shrink-0" />
          {/* Open Store icon */}
          <Link
            href={storeUrl}
            target="_blank"
            title="Open store"
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
          >
            <ExternalLink size={13} />
          </Link>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// Main shell export
// ─────────────────────────────────────────────────────────────

export function StoreEditorShell() {
  const [activeTab, setActiveTab] = useState<EditorTab>('products')
  const { isDirty, isSaving, saveChanges } = useStoreEditor()
  const storeUrl = `/store/${DEMO_SELLER_PROFILE.slug}`

  return (
    <div className="flex flex-col h-screen lg:h-full bg-[#f9f9f9]">
      <EditorTopBar />

      {/* Tab bar */}
      <div className="bg-white border-b border-neutral-200 shrink-0">
        <div className="flex items-end overflow-x-auto scrollbar-none px-4">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-3.5 sm:py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex-shrink-0',
                activeTab === tab.id
                  ? 'border-black text-black'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mobile quick actions — shortcuts for common tasks */}
        <div className="sm:hidden flex gap-2 px-3 pb-2.5 pt-1 overflow-x-auto scrollbar-none">
          <Link
            href="/dashboard/storefront"
            className="flex-shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 active:bg-neutral-100 transition-colors"
          >
            <Pencil size={11} className="text-neutral-500" />
            Edit Profile
          </Link>
          <Link
            href="/dashboard/products/new"
            className="flex-shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 active:bg-neutral-100 transition-colors"
          >
            <Plus size={11} className="text-neutral-500" />
            Add Product
          </Link>
          <button
            onClick={() => setActiveTab('layout')}
            className="flex-shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 active:bg-neutral-100 transition-colors"
          >
            <Layers size={11} className="text-neutral-500" />
            Change Layout
          </button>
          <Link
            href={storeUrl}
            target="_blank"
            className="flex-shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 active:bg-neutral-100 transition-colors"
          >
            <ExternalLink size={11} className="text-neutral-500" />
            Preview Store
          </Link>
        </div>
      </div>

      {/* Helper description — desktop only */}
      <div className="hidden sm:block bg-neutral-50 border-b border-neutral-100 px-5 py-2 shrink-0">
        <p className="text-[11px] text-neutral-400">{TAB_DESCRIPTIONS[activeTab]}</p>
      </div>

      {/* Tab content — scrollable */}
      <div className={cn('flex-1 min-h-0 overflow-y-auto', isDirty && 'pb-20 sm:pb-0')}>
        {activeTab === 'profile'  && <ProfileTab />}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'layout'   && <LayoutTab />}
        {activeTab === 'theme'    && <ThemeTab />}
      </div>

      {/* Mobile sticky save bar — only when unsaved changes exist */}
      {isDirty && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 px-4 py-3 flex items-center gap-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          <button
            onClick={saveChanges}
            disabled={isSaving}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold transition-all',
              isSaving
                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                : 'bg-black text-white hover:bg-neutral-800 active:bg-neutral-900 shadow-sm',
            )}
          >
            <CloudUpload size={15} />
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
          <Link
            href={storeUrl}
            target="_blank"
            className="flex-shrink-0 flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 bg-white active:bg-neutral-50 transition-colors"
          >
            <ExternalLink size={13} />
            Preview
          </Link>
        </div>
      )}
    </div>
  )
}
