'use client'
import { useState } from 'react'
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
import {
  Lock, ChevronDown, ChevronRight,
  Star, Eye, EyeOff, Pencil, Package, Plus, ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { ProductImage } from '@/components/ui/product-image'
import { useStoreEditor } from '@/context/store-editor-context'
import type { Product } from '@/lib/domain/entities'

// ── Section metadata ──────────────────────────────────────────
const SECTION_META: Record<string, { label: string; description: string; locked?: boolean; color: string }> = {
  header:       { label: 'Header',            description: 'Name, bio, avatar, social links', locked: true, color: 'bg-neutral-900' },
  featured:     { label: 'Featured Products', description: 'Up to 3 highlighted products',             color: 'bg-amber-500' },
  all_products: { label: 'All Products',      description: 'Full product catalog',                     color: 'bg-blue-500' },
  about:        { label: 'About',             description: 'Longer bio section',                       color: 'bg-violet-500' },
  links:        { label: 'Links',             description: 'Social & external links',                  color: 'bg-teal-500' },
  testimonials: { label: 'Testimonials',      description: 'Social proof',                             color: 'bg-rose-400' },
  faq:          { label: 'FAQ',               description: 'Frequently asked questions',               color: 'bg-orange-400' },
}

const TYPE_LABELS: Record<string, string> = {
  digital_download: 'Digital', service_offer: 'Service',
  subscription: 'Sub', bundle: 'Bundle', membership_ready: 'Membership',
}

// ── Drag Handle SVG (dotted grip) ─────────────────────────────
function GripDots({ className }: { className?: string }) {
  return (
    <svg
      width="10" height="16" viewBox="0 0 10 16" fill="none"
      className={className}
      aria-hidden="true"
    >
      {[0, 4, 8, 12].map(y =>
        [0, 4].map(x => (
          <circle key={`${x}-${y}`} cx={x + 1} cy={y + 2} r="1.5" fill="currentColor" />
        ))
      )}
    </svg>
  )
}

// ── Sortable Section Card ─────────────────────────────────────
function SortableSectionCard({ id, children }: {
  id: string
  children: (props: { isDragging: boolean; handle: React.ReactNode }) => React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const meta = SECTION_META[id]

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  }

  if (meta?.locked) {
    return (
      <div ref={setNodeRef} style={style}>
        {children({
          isDragging: false,
          handle: <Lock size={12} className="text-neutral-300" />,
        })}
      </div>
    )
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children({
        isDragging,
        handle: (
          <span
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-neutral-300 hover:text-neutral-500 touch-none px-1 flex items-center"
            title="Drag to reorder"
          >
            <GripDots />
          </span>
        ),
      })}
    </div>
  )
}

// ── Sortable Product Row ──────────────────────────────────────
function SortableProductRow({
  product, isFeatured, onToggleFeatured, onToggleHidden, isHidden, canFeature,
}: {
  product: Product
  isFeatured: boolean
  onToggleFeatured: () => void
  onToggleHidden: () => void
  isHidden: boolean
  canFeature: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'flex items-center gap-0 rounded-xl bg-white border transition-all duration-150',
        isDragging ? 'shadow-xl border-neutral-300 opacity-90 scale-[1.01]' : 'border-neutral-150 hover:border-neutral-300',
        isHidden && !isDragging && 'opacity-50',
      )}
    >
      {/* Drag zone */}
      <span
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-neutral-300 hover:text-neutral-500 touch-none flex items-center justify-center w-8 h-full py-3 rounded-l-xl hover:bg-neutral-50 transition-colors"
        title="Drag to reorder"
      >
        <GripDots />
      </span>

      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100 my-2.5">
        <ProductImage src={product.thumbnailUrl} alt={product.name} productType={product.productType} fill iconSize="sm" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 px-2.5 py-2.5">
        <p className={cn('text-xs font-semibold leading-tight truncate', isHidden ? 'text-neutral-400' : 'text-black')}>
          {product.name}
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className="text-[10px] text-neutral-400 font-medium">{TYPE_LABELS[product.productType]}</span>
          <span className="text-[10px] text-neutral-300">·</span>
          <span className="text-[10px] text-neutral-500 font-semibold">{formatCurrency(product.price, product.currency)}</span>
          {product.status === 'draft' && (
            <span className="text-[10px] bg-amber-50 text-amber-600 font-semibold px-1.5 py-0.5 rounded-full">Draft</span>
          )}
          {isFeatured && (
            <span className="text-[10px] bg-amber-50 text-amber-600 font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Star size={8} fill="currentColor" /> Featured
            </span>
          )}
          {isHidden && (
            <span className="text-[10px] bg-neutral-100 text-neutral-500 font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <EyeOff size={8} /> Hidden
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-0.5 pr-2 flex-shrink-0">
        <button
          onClick={onToggleFeatured}
          disabled={!canFeature && !isFeatured}
          title={isFeatured ? 'Remove from featured' : canFeature ? 'Add to featured' : 'Max 3 featured products'}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded-lg transition-colors',
            isFeatured
              ? 'text-amber-500 hover:bg-amber-50'
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
            'w-7 h-7 flex items-center justify-center rounded-lg transition-colors',
            isHidden
              ? 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'
              : 'text-neutral-300 hover:text-neutral-600 hover:bg-neutral-100',
          )}
        >
          {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
        <Link
          href={`/dashboard/products/${product.id}`}
          title="Edit product"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-300 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
        >
          <Pencil size={11} />
        </Link>
        <Link
          href={`/p/${product.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Preview product page"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-300 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
        >
          <ExternalLink size={11} />
        </Link>
      </div>
    </div>
  )
}

// ── Section Panel ─────────────────────────────────────────────
function SectionPanel({ id, handle, isDragging }: {
  id: string
  handle: React.ReactNode
  isDragging: boolean
}) {
  const { config, update, products } = useStoreEditor()
  const [expanded, setExpanded] = useState(id === 'featured' || id === 'all_products')
  const meta = SECTION_META[id]
  const isVisible = config.sectionVisibility[id] ?? false

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

  const canExpand = id === 'featured' || id === 'all_products'
  const orderMap = new Map(config.productOrder.map((pid, i) => [pid, i]))
  const allSorted = [...products].sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999))
  const featuredProducts = config.featuredProductIds
    .map(fid => products.find(p => p.id === fid))
    .filter(Boolean) as Product[]

  return (
    <div className={cn(
      'rounded-xl bg-white border overflow-hidden transition-all duration-150',
      isDragging ? 'shadow-2xl border-neutral-300 ring-1 ring-black/5' : 'border-neutral-200 hover:border-neutral-300',
      !isVisible && 'opacity-60',
    )}>
      {/* Section header row */}
      <div className="flex items-center">
        {/* Drag handle zone */}
        <div className="flex items-center justify-center w-8 self-stretch hover:bg-neutral-50 transition-colors">
          {handle}
        </div>

        {/* Color dot */}
        <div className={cn('w-2 h-2 rounded-full flex-shrink-0 mr-2.5', meta?.color)} />

        {/* Info */}
        <div className="flex-1 min-w-0 py-3">
          <p className={cn('text-xs font-bold leading-tight', isVisible ? 'text-black' : 'text-neutral-500')}>
            {meta?.label}
          </p>
          <p className="text-[10px] text-neutral-400 mt-0.5 leading-tight">{meta?.description}</p>
        </div>

        {/* Right: visibility toggle + expand */}
        <div className="flex items-center gap-1 pr-2.5">
          {/* Visibility pill toggle */}
          <button
            onClick={() => update({ sectionVisibility: { ...config.sectionVisibility, [id]: !isVisible } })}
            disabled={meta?.locked}
            title={isVisible ? 'Hide section' : 'Show section'}
            className={cn(
              'h-5 px-2 rounded-full text-[10px] font-semibold transition-colors border',
              isVisible
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                : 'bg-neutral-100 text-neutral-400 border-neutral-200 hover:bg-neutral-200',
              meta?.locked && 'opacity-40 cursor-not-allowed pointer-events-none',
            )}
          >
            {isVisible ? 'Visible' : 'Hidden'}
          </button>

          {canExpand && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors text-neutral-400"
            >
              {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* Featured products expandable */}
      {canExpand && expanded && id === 'featured' && (
        <div className="border-t border-neutral-100 px-3 pt-3 pb-3 space-y-1.5 bg-neutral-50/50">
          {featuredProducts.length === 0 ? (
            <div className="flex flex-col items-center py-5 text-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <Star size={14} className="text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-700">No featured products</p>
                <p className="text-[10px] text-neutral-400 mt-0.5">Star a product below to feature it</p>
              </div>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={e => handleProductDragEnd(e, config.featuredProductIds, 'featuredProductIds')}
            >
              <SortableContext items={config.featuredProductIds} strategy={verticalListSortingStrategy}>
                {featuredProducts.map(p => (
                  <SortableProductRow
                    key={p.id} product={p} isFeatured
                    onToggleFeatured={() => toggleFeatured(p.id)}
                    onToggleHidden={() => toggleHidden(p.id)}
                    isHidden={config.hiddenProductIds.includes(p.id)}
                    canFeature={config.featuredProductIds.length < 3}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
          <p className="text-[10px] text-neutral-400 text-center pt-1">
            {config.featuredProductIds.length} / 3 featured
          </p>
        </div>
      )}

      {/* All products expandable */}
      {canExpand && expanded && id === 'all_products' && (
        <div className="border-t border-neutral-100 px-3 pt-3 pb-3 space-y-1.5 bg-neutral-50/50">
          {products.length === 0 ? (
            <div className="flex flex-col items-center py-5 text-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                <Package size={14} className="text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-700">No products yet</p>
                <Link
                  href="/dashboard/products/new"
                  className="text-[10px] text-black font-semibold underline underline-offset-2"
                >
                  Add your first product
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
                  {allSorted.map(p => (
                    <SortableProductRow
                      key={p.id} product={p}
                      isFeatured={config.featuredProductIds.includes(p.id)}
                      onToggleFeatured={() => toggleFeatured(p.id)}
                      onToggleHidden={() => toggleHidden(p.id)}
                      isHidden={config.hiddenProductIds.includes(p.id)}
                      canFeature={config.featuredProductIds.length < 3}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              <Link
                href="/dashboard/products/new"
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-dashed border-neutral-200 text-[10px] font-semibold text-neutral-400 hover:text-neutral-600 hover:border-neutral-300 hover:bg-white transition-colors mt-1"
              >
                <Plus size={11} /> Add product
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Section Arranger (Center Column) ──────────────────────────
export function SectionArranger() {
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
    <div className="flex flex-col h-full">
      {/* Column header */}
      <div className="px-4 py-3 border-b border-neutral-100 bg-white shrink-0">
        <h2 className="text-sm font-bold text-black">Store Structure</h2>
        <p className="text-[11px] text-neutral-400 mt-0.5">
          Drag to reorder · <Star size={9} className="inline mb-0.5" /> to feature · <EyeOff size={9} className="inline mb-0.5" /> to hide
        </p>
      </div>

      {/* Scrollable section list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
          <SortableContext items={config.sectionOrder} strategy={verticalListSortingStrategy}>
            {config.sectionOrder.map(id => (
              <SortableSectionCard key={id} id={id}>
                {({ isDragging, handle }) => (
                  <SectionPanel id={id} handle={handle} isDragging={isDragging} />
                )}
              </SortableSectionCard>
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}
