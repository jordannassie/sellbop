'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Play, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { HIGGSFIELD_URL, HIGGSFIELD_ICON } from '@/components/dashboard/product-creation-shortcuts'
import { AddMediaModal, type GalleryMediaItem } from './add-media-modal'
import { ProductMediaGalleryViewer } from './product-media-gallery-viewer'
import type { PendingProductMediaItem, ProductMediaItem } from '@/lib/product-media/types'
import { getPrimaryImageUrl } from '@/lib/product-media/utils'
import {
  PRODUCT_IMAGE_ASPECT_RATIO,
  PRODUCT_IMAGE_RECOMMENDED_LABEL,
  HIGGSFIELD_PRODUCT_IMAGE_HINT,
} from '@/lib/product-media/constants'

function tempId() {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function SortableThumb({
  item,
  active,
  onSelect,
  onRemove,
}: {
  item: GalleryMediaItem
  active: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 20 : undefined }
  const thumb = item.thumbnail_url ?? (item.media_type === 'image' ? item.url : null)
  const isVideo = item.media_type === 'video_link'

  return (
    <div ref={setNodeRef} style={style} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 bg-neutral-100',
          active ? 'border-black' : 'border-neutral-200',
        )}
      >
        <span
          {...attributes}
          {...listeners}
          className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
          aria-hidden
        />
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="w-full h-full object-cover pointer-events-none" />
        ) : (
          <span className="flex w-full h-full items-center justify-center bg-neutral-200 pointer-events-none">
            <Play size={18} className="text-neutral-500" />
          </span>
        )}
        {isVideo && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none">
            <Play size={14} className="text-white" fill="white" />
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={e => {
          e.stopPropagation()
          onRemove()
        }}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black text-white flex items-center justify-center hover:bg-neutral-800"
        aria-label="Remove media"
      >
        <X size={10} />
      </button>
    </div>
  )
}

interface ProductMediaSectionProps {
  productId?: string | null
  items: GalleryMediaItem[]
  onChange: (items: GalleryMediaItem[], primaryImageUrl: string | null) => void
  onLegacyCoverClear?: () => Promise<void>
}

export function ProductMediaSection({ productId, items, onChange, onLegacyCoverClear }: ProductMediaSectionProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order)

  useEffect(() => {
    if (selectedIndex >= sorted.length) setSelectedIndex(Math.max(0, sorted.length - 1))
  }, [sorted.length, selectedIndex])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const notifyChange = useCallback(
    (next: GalleryMediaItem[]) => {
      const normalized = next.map((item, index) => ({ ...item, sort_order: index }))
      onChange(normalized, getPrimaryImageUrl(normalized as ProductMediaItem[]))
    },
    [onChange],
  )

  async function persistReorder(order: GalleryMediaItem[]) {
    notifyChange(order)
    if (!productId) return
    const realIds = order.filter(i => i.id !== 'legacy-cover' && !i.id.startsWith('temp-')).map(i => i.id)
    if (realIds.length === 0) return
    await fetch(`/api/products/${productId}/media`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: realIds }),
    })
  }

  async function handleAdd(item: Omit<PendingProductMediaItem, 'id' | 'sort_order'>) {
    try {
      if (productId) {
        const res = await fetch(`/api/products/${productId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to add media.')
        const next = [...sorted.filter(i => i.id !== 'legacy-cover'), data.media].map((m, i) => ({
          ...m,
          sort_order: i,
        }))
        notifyChange(next)
        setSelectedIndex(next.length - 1)
        return
      }

      const newItem: PendingProductMediaItem = {
        ...item,
        id: tempId(),
        sort_order: sorted.length,
      }
      const next = [...sorted, newItem]
      notifyChange(next)
      setSelectedIndex(next.length - 1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add media.')
    }
  }

  async function handleRemove(id: string) {
    try {
      if (id === 'legacy-cover') {
        if (onLegacyCoverClear) await onLegacyCoverClear()
        notifyChange([])
        return
      }
      if (productId && !id.startsWith('temp-')) {
        const res = await fetch(`/api/products/${productId}/media?mediaId=${id}`, { method: 'DELETE' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to remove media.')
        notifyChange(data.media ?? [])
        return
      }
      const next = sorted.filter(i => i.id !== id)
      notifyChange(next)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove media.')
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sorted.findIndex(i => i.id === active.id)
    const newIndex = sorted.findIndex(i => i.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(sorted, oldIndex, newIndex)
    setSelectedIndex(newIndex)
    persistReorder(next)
  }

  const viewerItems = sorted.length > 0 ? sorted : []

  return (
    <div>
      {viewerItems.length > 0 ? (
        <>
          <div className="max-w-md mx-auto w-full">
            <ProductMediaGalleryViewer
              items={viewerItems}
              aspectStyle={{ aspectRatio: PRODUCT_IMAGE_ASPECT_RATIO }}
              mainObjectFit="cover"
              showThumbnails={false}
              selectedIndex={selectedIndex}
              onSelectedIndexChange={setSelectedIndex}
              className="mb-3"
            />
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sorted.map(i => i.id)} strategy={horizontalListSortingStrategy}>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide items-start">
                {sorted.map((item, index) => (
                  <SortableThumb
                    key={item.id}
                    item={item}
                    active={index === selectedIndex}
                    onSelect={() => setSelectedIndex(index)}
                    onRemove={() => handleRemove(item.id)}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 flex items-center justify-center text-neutral-400 hover:border-neutral-400 hover:text-black transition-colors"
                  aria-label="Add media"
                >
                  <Plus size={22} />
                </button>
              </div>
            </SortableContext>
          </DndContext>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="w-full max-w-md mx-auto aspect-square rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 flex flex-col items-center justify-center text-neutral-500 hover:border-neutral-400 hover:bg-neutral-100 transition-colors"
        >
          <Plus size={28} className="mb-2" />
          <span className="text-sm font-medium">Add product media</span>
        </button>
      )}

      <p className="text-xs text-neutral-500 mt-3">
        The first image is your primary product image. Drag media to reorder.
      </p>
      <p className="text-xs text-neutral-400 mt-1">{PRODUCT_IMAGE_RECOMMENDED_LABEL}</p>

      <a
        href={HIGGSFIELD_URL}
        target="_blank"
        rel="noopener noreferrer"
        title={HIGGSFIELD_PRODUCT_IMAGE_HINT}
        className="inline-flex items-center gap-2 mt-3 text-xs font-medium text-neutral-500 hover:text-black transition-colors"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HIGGSFIELD_ICON} alt="" className="w-4 h-4 rounded" />
        Create with Higgsfield
      </a>

      <AddMediaModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAdd} />
    </div>
  )
}
