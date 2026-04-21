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
  GripVertical, Lock, ChevronDown, ChevronRight,
  Star, StarOff, Eye, EyeOff, Pencil, Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { ProductImage } from '@/components/ui/product-image'
import { useStoreEditor } from '@/context/store-editor-context'
import type { Product } from '@/lib/domain/entities'

// ── Section metadata ──────────────────────────────────────────
const SECTION_META: Record<string, { label: string; description: string; locked?: boolean }> = {
  header: { label: 'Header', description: 'Profile, name, bio, social links', locked: true },
  featured: { label: 'Featured Products', description: 'Up to 3 highlighted products' },
  all_products: { label: 'All Products', description: 'Full product catalog' },
  about: { label: 'About', description: 'Longer bio section' },
  links: { label: 'Links', description: 'Social & external links' },
  testimonials: { label: 'Testimonials', description: 'Social proof (placeholder)' },
  faq: { label: 'FAQ', description: 'Frequently asked questions (placeholder)' },
}

const TYPE_LABELS: Record<string, string> = {
  digital_download: 'Digital', service_offer: 'Service',
  subscription: 'Sub', bundle: 'Bundle', membership_ready: 'Membership',
}

// ── Sortable Section Card ─────────────────────────────────────
function SortableSectionCard({ id, children }: { id: string; children: (dragProps: { isDragging: boolean; handle: React.ReactNode }) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.85 : 1,
  }

  const meta = SECTION_META[id]
  if (meta?.locked) {
    // Locked sections show a lock icon instead of drag handle
    return (
      <div ref={setNodeRef} style={style}>
        {children({
          isDragging,
          handle: <Lock size={13} className="text-neutral-300" />,
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
            className="cursor-grab active:cursor-grabbing text-neutral-300 hover:text-neutral-500 touch-none"
          >
            <GripVertical size={15} />
          </span>
        ),
      })}
    </div>
  )
}

// ── Sortable Product Row ──────────────────────────────────────
function SortableProductRow({ product, isFeatured, onToggleFeatured, onToggleHidden, isHidden, canFeature }: {
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
    opacity: isDragging ? 0.75 : isHidden ? 0.45 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-white transition-shadow',
        isDragging ? 'shadow-lg border-neutral-300' : 'border-neutral-100 hover:border-neutral-200',
      )}
    >
      {/* Drag handle */}
      <span
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-neutral-300 hover:text-neutral-500 flex-shrink-0 touch-none"
      >
        <GripVertical size={14} />
      </span>

      {/* Thumbnail */}
      <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100">
        <ProductImage src={product.thumbnailUrl} alt={product.name} productType={product.productType} fill iconSize="sm" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs font-semibold leading-tight truncate', isHidden ? 'text-neutral-400' : 'text-black')}>
          {product.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-neutral-400">{TYPE_LABELS[product.productType]}</span>
          <span className="text-[10px] text-neutral-300">·</span>
          <span className="text-[10px] font-medium text-neutral-500">{formatCurrency(product.price, product.currency)}</span>
          {product.status === 'draft' && (
            <>
              <span className="text-[10px] text-neutral-300">·</span>
              <span className="text-[10px] text-amber-500 font-medium">Draft</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onToggleFeatured}
          disabled={!canFeature && !isFeatured}
          title={isFeatured ? 'Remove from featured' : canFeature ? 'Add to featured' : 'Max 3 featured'}
          className={cn(
            'w-6 h-6 flex items-center justify-center rounded-lg transition-colors',
            isFeatured ? 'text-amber-500 hover:text-amber-600' : 'text-neutral-300 hover:text-amber-400',
            !canFeature && !isFeatured && 'opacity-30 cursor-not-allowed',
          )}
        >
          {isFeatured ? <Star size={12} fill="currentColor" /> : <StarOff size={12} />}
        </button>
        <button
          onClick={onToggleHidden}
          title={isHidden ? 'Show on storefront' : 'Hide from storefront'}
          className={cn(
            'w-6 h-6 flex items-center justify-center rounded-lg transition-colors',
            isHidden ? 'text-neutral-300 hover:text-neutral-500' : 'text-neutral-400 hover:text-neutral-600',
          )}
        >
          {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
        </button>
        <Link
          href={`/dashboard/products/${product.id}`}
          title="Edit product"
          className="w-6 h-6 flex items-center justify-center rounded-lg text-neutral-300 hover:text-neutral-600 transition-colors"
        >
          <Pencil size={11} />
        </Link>
      </div>
    </div>
  )
}

// ── Section Panel ─────────────────────────────────────────────
function SectionPanel({ id, handle, isDragging }: { id: string; handle: React.ReactNode; isDragging: boolean }) {
  const { config, update, products } = useStoreEditor()
  const [expanded, setExpanded] = useState(id === 'featured' || id === 'all_products')
  const meta = SECTION_META[id]
  const isVisible = config.sectionVisibility[id] ?? false

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleProductDragEnd(event: DragEndEvent, productIds: string[], field: 'productOrder' | 'featuredProductIds') {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = productIds.indexOf(active.id as string)
    const newIndex = productIds.indexOf(over.id as string)
    update({ [field]: arrayMove(productIds, oldIndex, newIndex) })
  }

  function toggleFeatured(productId: string) {
    const current = config.featuredProductIds
    if (current.includes(productId)) {
      update({ featuredProductIds: current.filter(id => id !== productId) })
    } else if (current.length < 3) {
      update({ featuredProductIds: [...current, productId] })
    }
  }

  function toggleHidden(productId: string) {
    const current = config.hiddenProductIds
    if (current.includes(productId)) {
      update({ hiddenProductIds: current.filter(id => id !== productId) })
    } else {
      update({ hiddenProductIds: [...current, productId] })
    }
  }

  const canExpand = id === 'featured' || id === 'all_products'

  // Get products for each section
  const orderMap = new Map(config.productOrder.map((pid, i) => [pid, i]))
  const allSorted = [...products].sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999))
  const featuredProducts = config.featuredProductIds
    .map(fid => products.find(p => p.id === fid))
    .filter(Boolean) as Product[]
  const nonFeaturedProducts = allSorted.filter(p => !config.featuredProductIds.includes(p.id))

  return (
    <div className={cn(
      'border rounded-xl bg-white transition-shadow',
      isDragging ? 'shadow-lg border-neutral-300' : 'border-neutral-200',
      !isVisible && 'opacity-50',
    )}>
      {/* Section header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="flex-shrink-0">{handle}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-black">{meta?.label}</p>
          <p className="text-[10px] text-neutral-400">{meta?.description}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Visibility badge */}
          <span className={cn(
            'text-[10px] font-medium px-1.5 py-0.5 rounded',
            isVisible ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-400',
          )}>
            {isVisible ? 'On' : 'Off'}
          </span>
          {/* Expand toggle for product sections */}
          {canExpand && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors text-neutral-400"
            >
              {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* Featured products */}
      {canExpand && expanded && id === 'featured' && (
        <div className="border-t border-neutral-100 px-3 pt-3 pb-3 space-y-2">
          {featuredProducts.length === 0 ? (
            <div className="text-center py-4 text-xs text-neutral-400">
              <Star size={16} className="mx-auto mb-1 opacity-30" />
              No featured products yet.
              <br />Star products below to feature them.
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
                    key={p.id}
                    product={p}
                    isFeatured
                    onToggleFeatured={() => toggleFeatured(p.id)}
                    onToggleHidden={() => toggleHidden(p.id)}
                    isHidden={config.hiddenProductIds.includes(p.id)}
                    canFeature={config.featuredProductIds.length < 3}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
          <p className="text-[10px] text-neutral-400 text-center">
            {config.featuredProductIds.length}/3 featured
          </p>
        </div>
      )}

      {/* All products */}
      {canExpand && expanded && id === 'all_products' && (
        <div className="border-t border-neutral-100 px-3 pt-3 pb-3 space-y-2">
          {products.length === 0 ? (
            <div className="text-center py-4 text-xs text-neutral-400">
              <Package size={16} className="mx-auto mb-1 opacity-30" />
              No products yet.{' '}
              <Link href="/dashboard/products/new" className="text-black underline underline-offset-2">
                Add your first
              </Link>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={e => handleProductDragEnd(e, config.productOrder, 'productOrder')}
            >
              <SortableContext items={config.productOrder} strategy={verticalListSortingStrategy}>
                {allSorted.map(p => (
                  <SortableProductRow
                    key={p.id}
                    product={p}
                    isFeatured={config.featuredProductIds.includes(p.id)}
                    onToggleFeatured={() => toggleFeatured(p.id)}
                    onToggleHidden={() => toggleHidden(p.id)}
                    isHidden={config.hiddenProductIds.includes(p.id)}
                    canFeature={config.featuredProductIds.length < 3}
                  />
                ))}
              </SortableContext>
            </DndContext>
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
    if (!over || active.id === over.id) return
    // Prevent dragging "header" (locked)
    if (active.id === 'header') return
    const oldIndex = config.sectionOrder.indexOf(active.id as string)
    const newIndex = config.sectionOrder.indexOf(over.id as string)
    // Don't allow dropping before header (index 0)
    const safeNewIndex = Math.max(1, newIndex)
    update({ sectionOrder: arrayMove(config.sectionOrder, oldIndex, safeNewIndex) })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-100">
        <h2 className="text-sm font-bold text-black">Store Structure</h2>
        <p className="text-xs text-neutral-400 mt-0.5">Drag sections to reorder · Star to feature · Eye to hide</p>
      </div>

      {/* Section list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleSectionDragEnd}
        >
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
