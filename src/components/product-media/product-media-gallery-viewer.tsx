'use client'

import { useEffect, useState } from 'react'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getVideoEmbedUrl } from '@/lib/product-media/video-url'
import type { GalleryMediaItem } from './add-media-modal'
import { ImageLightbox } from './image-lightbox'

interface ProductMediaGalleryViewerProps {
  items: GalleryMediaItem[]
  aspectClassName?: string
  aspectStyle?: React.CSSProperties
  mainObjectFit?: 'cover' | 'contain'
  enableLightbox?: boolean
  showThumbnails?: boolean
  selectedIndex?: number
  onSelectedIndexChange?: (index: number) => void
  className?: string
}

function getEmbedUrl(item: GalleryMediaItem): string | null {
  if (item.media_type !== 'video_link') return null
  if ('embed_url' in item && item.embed_url) return item.embed_url
  return getVideoEmbedUrl({ provider: item.provider, url: item.url })
}

function getThumbUrl(item: GalleryMediaItem): string | null {
  if (item.thumbnail_url) return item.thumbnail_url
  if (item.media_type === 'image') return item.url
  return null
}

export function ProductMediaGalleryViewer({
  items,
  aspectClassName = 'aspect-video',
  aspectStyle,
  mainObjectFit = 'cover',
  enableLightbox = false,
  showThumbnails = true,
  selectedIndex: controlledIndex,
  onSelectedIndexChange,
  className,
}: ProductMediaGalleryViewerProps) {
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order)
  const [internalIndex, setInternalIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const selectedIndex = controlledIndex ?? internalIndex
  const setSelectedIndex = onSelectedIndexChange ?? setInternalIndex

  useEffect(() => {
    if (selectedIndex >= sorted.length) setSelectedIndex(Math.max(0, sorted.length - 1))
  }, [sorted.length, selectedIndex, setSelectedIndex])

  const imageItems = sorted.filter(i => i.media_type === 'image')
  const selected = sorted[selectedIndex] ?? sorted[0]

  if (sorted.length === 0) return null

  return (
    <div className={cn(className)}>
      <div
        className={cn(
          'relative w-full rounded-2xl overflow-hidden bg-neutral-100',
          !aspectStyle && aspectClassName,
          showThumbnails && sorted.length > 1 && 'mb-3',
        )}
        style={aspectStyle}
      >
        {selected?.media_type === 'video_link' ? (
          <iframe
            src={getEmbedUrl(selected) ?? undefined}
            title="Product video"
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : selected ? (
          <button
            type="button"
            onClick={() => {
              if (enableLightbox && selected.media_type === 'image') setLightboxOpen(true)
            }}
            className={cn(
              'w-full h-full block',
              enableLightbox ? 'cursor-zoom-in' : 'cursor-default',
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected.url}
              alt=""
              className={cn(
                'w-full h-full',
                mainObjectFit === 'contain' ? 'object-contain' : 'object-cover',
              )}
            />
          </button>
        ) : null}
      </div>

      {showThumbnails && sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {sorted.map((item, index) => {
            const thumb = getThumbUrl(item)
            const isVideo = item.media_type === 'video_link'
            const active = index === selectedIndex
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  'relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-colors bg-neutral-100',
                  active ? 'border-black' : 'border-neutral-200 hover:border-neutral-400',
                )}
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-200">
                    <Play size={18} className="text-neutral-500" />
                  </div>
                )}
                {isVideo && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <Play size={16} className="text-white" fill="white" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {enableLightbox && lightboxOpen && selected?.media_type === 'image' && (
        <ImageLightbox
          images={imageItems.map(i => ({ id: i.id, url: i.url }))}
          initialId={selected.id}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  )
}
