'use client'
import { useState } from 'react'
import {
  User, Palette, LayoutGrid, Package2,
  ExternalLink, Copy, Check, CloudUpload, Globe,
  Star, Eye, EyeOff, Pencil, Plus, Lock, Package,
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
import { useStoreEditor } from '@/context/store-editor-context'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { toast } from 'sonner'
import type { Storefront, Product } from '@/lib/domain/entities'

// ─────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────

type EditorTab = 'profile' | 'products' | 'layout' | 'theme'

const TABS: { id: EditorTab; label: string }[] = [
  { id: 'profile',  label: 'Profile' },
  { id: 'products', label: 'Products' },
  { id: 'layout',   label: 'Layout' },
  { id: 'theme',    label: 'Theme' },
]

const TAB_DESCRIPTIONS: Record<EditorTab, string> = {
  profile:  'Add your store details and social links',
  products: 'Choose featured items and arrange product order',
  layout:   'Control which sections appear on your store',
  theme:    'Pick the look and feel of your store',
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
// Small SVG icons
// ─────────────────────────────────────────────────────────────

function TwitterIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function YoutubeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

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
// Form field components
// ─────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-neutral-600 mb-1.5">{children}</p>
}

function FieldInput({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm border border-neutral-200 rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-400 placeholder:text-neutral-300 transition-colors"
    />
  )
}

function FieldTextarea({ value, onChange, placeholder, rows = 4 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full text-sm border border-neutral-200 rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-400 placeholder:text-neutral-300 resize-none transition-colors"
    />
  )
}

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

// Horizontal rule with title for grouping content within a tab
function SectionDivider({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <p className="text-sm font-bold text-black whitespace-nowrap">{children}</p>
      {right && <span>{right}</span>}
      <div className="flex-1 border-t border-neutral-150" />
    </div>
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

      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100 my-2.5 ml-2.5">
        <ProductImage src={product.thumbnailUrl} alt={product.name} productType={product.productType} fill iconSize="sm" />
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
          <span className="text-[9px] text-neutral-400 font-semibold">{TYPE_LABELS[product.productType]}</span>
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
          title={isHidden ? 'Show on storefront' : 'Hide from storefront'}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded-lg transition-all',
            isHidden
              ? 'text-neutral-500 bg-neutral-100 hover:bg-neutral-200'
              : 'text-neutral-300 hover:text-neutral-600 hover:bg-neutral-100',
          )}
        >
          {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
        <Link
          href={`/dashboard/products/${product.id}`}
          title="Edit product"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-300 hover:text-neutral-700 hover:bg-neutral-100 transition-all"
        >
          <Pencil size={11} />
        </Link>
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
  const { config, update } = useStoreEditor()

  return (
    <div className="max-w-xl mx-auto px-5 py-8 space-y-9">
      {/* Avatar preview */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-neutral-150 shadow-sm">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-black flex-shrink-0"
          style={{ backgroundColor: config.themeColor }}
        >
          {config.title.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-black truncate">{config.title || 'Your Store'}</p>
          <p className="text-xs text-neutral-400 mt-0.5 truncate">{config.headline || 'Add a headline below'}</p>
          <p className="text-[10px] text-neutral-300 mt-1">Avatar upload — coming soon</p>
        </div>
      </div>

      {/* Store info */}
      <div>
        <SectionDivider>Store Info</SectionDivider>
        <div className="space-y-5">
          <div>
            <FieldLabel>Store Name</FieldLabel>
            <FieldInput value={config.title} onChange={v => update({ title: v })} placeholder="Alex Creates" />
          </div>
          <div>
            <FieldLabel>Headline</FieldLabel>
            <FieldInput
              value={config.headline ?? ''}
              onChange={v => update({ headline: v || null })}
              placeholder="Short tagline…"
            />
          </div>
          <div>
            <FieldLabel>Bio</FieldLabel>
            <FieldTextarea
              value={config.bio ?? ''}
              onChange={v => update({ bio: v || null })}
              placeholder="Tell buyers who you are and what you create…"
              rows={4}
            />
            {!config.bio && (
              <p className="text-[10px] text-amber-600 bg-amber-50 px-3 py-2 rounded-xl mt-2 font-medium">
                ✦ Add your bio — buyers want to know who you are.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Social links */}
      <div>
        <SectionDivider>Social Links</SectionDivider>
        {!config.socialLinks.twitter && !config.socialLinks.instagram && !config.socialLinks.website && !config.socialLinks.youtube && (
          <p className="text-[10px] text-amber-600 bg-amber-50 px-3 py-2 rounded-xl mb-4 font-medium">
            ✦ Add your social links — they appear as buttons on your store.
          </p>
        )}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-neutral-400 flex-shrink-0 w-5 flex items-center justify-center"><TwitterIcon /></span>
            <FieldInput
              value={config.socialLinks.twitter ?? ''}
              onChange={v => update({ socialLinks: { ...config.socialLinks, twitter: v || undefined } })}
              placeholder="https://twitter.com/handle"
              type="url"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-neutral-400 flex-shrink-0 w-5 flex items-center justify-center"><InstagramIcon /></span>
            <FieldInput
              value={config.socialLinks.instagram ?? ''}
              onChange={v => update({ socialLinks: { ...config.socialLinks, instagram: v || undefined } })}
              placeholder="https://instagram.com/handle"
              type="url"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-neutral-400 flex-shrink-0 w-5 flex items-center justify-center"><YoutubeIcon /></span>
            <FieldInput
              value={config.socialLinks.youtube ?? ''}
              onChange={v => update({ socialLinks: { ...config.socialLinks, youtube: v || undefined } })}
              placeholder="https://youtube.com/@handle"
              type="url"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-neutral-400 flex-shrink-0 w-5 flex items-center justify-center">
              <Globe size={12} />
            </span>
            <FieldInput
              value={config.socialLinks.website ?? ''}
              onChange={v => update({ socialLinks: { ...config.socialLinks, website: v || undefined } })}
              placeholder="https://yoursite.com"
              type="url"
            />
          </div>
        </div>
      </div>
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

  function handleProductDragEnd(event: DragEndEvent, ids: string[], field: 'productOrder' | 'featuredProductIds') {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = ids.indexOf(active.id as string)
    const newIndex = ids.indexOf(over.id as string)
    update({ [field]: arrayMove(ids, oldIndex, newIndex) })
  }

  function toggleFeatured(productId: string) {
    const cur = config.featuredProductIds
    update({
      featuredProductIds: cur.includes(productId)
        ? cur.filter(id => id !== productId)
        : cur.length < 3 ? [...cur, productId] : cur,
    })
  }

  function toggleHidden(productId: string) {
    const cur = config.hiddenProductIds
    update({
      hiddenProductIds: cur.includes(productId)
        ? cur.filter(id => id !== productId)
        : [...cur, productId],
    })
  }

  const orderMap = new Map(config.productOrder.map((pid, i) => [pid, i]))
  const allSorted = [...products].sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999))
  const featuredProducts = config.featuredProductIds
    .map(fid => products.find(p => p.id === fid))
    .filter(Boolean) as Product[]
  const canFeature = config.featuredProductIds.length < 3

  return (
    <div className="max-w-xl mx-auto px-5 py-8 space-y-10">
      {/* Featured */}
      <div>
        <SectionDivider right={
          <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full whitespace-nowrap">
            {config.featuredProductIds.length} / 3 slots
          </span>
        }>
          Featured Products
        </SectionDivider>

        {featuredProducts.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center gap-3 bg-white rounded-2xl border border-dashed border-neutral-200">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
              <Star size={16} className="text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-700">No featured products yet</p>
              <p className="text-xs text-neutral-400 mt-1">
                Click <Star size={9} className="inline -mt-0.5 text-amber-500" /> on any product below to feature it.
              </p>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={e => handleProductDragEnd(e, config.featuredProductIds, 'featuredProductIds')}
          >
            <SortableContext items={config.featuredProductIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {featuredProducts.map(p => (
                  <SortableProductRow
                    key={p.id}
                    product={p}
                    isFeatured
                    onToggleFeatured={() => toggleFeatured(p.id)}
                    onToggleHidden={() => toggleHidden(p.id)}
                    isHidden={config.hiddenProductIds.includes(p.id)}
                    canFeature={canFeature}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* All products */}
      <div>
        <SectionDivider>All Products</SectionDivider>
        {products.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center gap-3 bg-white rounded-2xl border border-dashed border-neutral-200">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Package size={16} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-700">No products yet</p>
              <Link href="/dashboard/products/new" className="text-xs text-black font-bold underline underline-offset-2 mt-1 inline-block">
                Add your first product →
              </Link>
            </div>
          </div>
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={e => handleProductDragEnd(e, config.productOrder, 'productOrder')}
            >
              <SortableContext items={config.productOrder} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {allSorted.map(p => (
                    <SortableProductRow
                      key={p.id}
                      product={p}
                      isFeatured={config.featuredProductIds.includes(p.id)}
                      onToggleFeatured={() => toggleFeatured(p.id)}
                      onToggleHidden={() => toggleHidden(p.id)}
                      isHidden={config.hiddenProductIds.includes(p.id)}
                      canFeature={canFeature}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <Link
              href="/dashboard/products/new"
              className="flex items-center justify-center gap-1.5 w-full py-3 rounded-xl border border-dashed border-neutral-200 text-xs font-bold text-neutral-400 hover:text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 transition-all mt-3"
            >
              <Plus size={12} /> Add product
            </Link>
          </>
        )}
      </div>
    </div>
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

  return (
    <div className="max-w-xl mx-auto px-5 py-8">
      <SectionDivider>Store Layout</SectionDivider>
      <p className="text-xs text-neutral-500 mb-6">
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
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Tab: Theme
// ─────────────────────────────────────────────────────────────

function ThemeTab() {
  const { config, update } = useStoreEditor()

  return (
    <div className="max-w-xl mx-auto px-5 py-8 space-y-9">
      <div>
        <SectionDivider>Theme Preset</SectionDivider>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {THEME_PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => update(p.patch)}
              className="text-sm border border-neutral-200 rounded-xl py-2.5 px-3 text-center font-semibold text-neutral-700 hover:border-black hover:bg-neutral-50 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <SectionDivider>Accent Color</SectionDivider>
        <ColorPicker value={config.themeColor} onChange={v => update({ themeColor: v })} />
      </div>

      <div>
        <SectionDivider>Button Style</SectionDivider>
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

      <div>
        <SectionDivider>Card Style</SectionDivider>
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

      <div>
        <SectionDivider>Header Layout</SectionDivider>
        <OptionPills
          value={config.headerLayout}
          onChange={v => update({ headerLayout: v })}
          options={[
            { value: 'left_avatar',  label: 'Left'     },
            { value: 'centered',     label: 'Centered' },
            { value: 'banner_avatar', label: 'Banner'  },
          ]}
        />
      </div>

      <div>
        <SectionDivider>Card Density</SectionDivider>
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
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Top header bar
// ─────────────────────────────────────────────────────────────

function EditorTopBar() {
  const { isDirty, isSaving, saveChanges } = useStoreEditor()
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
    <div className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-4 shrink-0">
      {/* Left: title + dirty badge */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <h1 className="text-sm font-bold text-black tracking-tight leading-none">Store Editor</h1>
          <p className="text-[10px] text-neutral-400 leading-none mt-0.5 hidden sm:block">Edit your storefront</p>
        </div>
        {isDirty && (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
            <span className="hidden sm:inline">Unsaved changes</span>
            <span className="sm:hidden">Unsaved</span>
          </div>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={copyLink}
          title="Copy public link"
          className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-neutral-600 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
        >
          {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>

        <Link
          href={storeUrl}
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-neutral-600 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
        >
          <ExternalLink size={12} />
          Open Store
        </Link>

        <button
          onClick={saveChanges}
          disabled={!isDirty || isSaving}
          className={cn(
            'flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-bold transition-all duration-150',
            isDirty && !isSaving
              ? 'bg-black text-white hover:bg-neutral-800 shadow-sm ring-1 ring-black/20'
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed',
          )}
        >
          <CloudUpload size={13} />
          {isSaving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main shell export
// ─────────────────────────────────────────────────────────────

export function StoreEditorShell() {
  const [activeTab, setActiveTab] = useState<EditorTab>('profile')

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
                'px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex-shrink-0',
                activeTab === tab.id
                  ? 'border-black text-black'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Helper description */}
      <div className="bg-neutral-50 border-b border-neutral-100 px-5 py-2 shrink-0">
        <p className="text-[11px] text-neutral-400">{TAB_DESCRIPTIONS[activeTab]}</p>
      </div>

      {/* Tab content — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'profile'  && <ProfileTab />}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'layout'   && <LayoutTab />}
        {activeTab === 'theme'    && <ThemeTab />}
      </div>
    </div>
  )
}
