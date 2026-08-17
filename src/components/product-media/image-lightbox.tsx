'use client'

import { useEffect, useCallback, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface ImageLightboxProps {
  images: { id: string; url: string }[]
  initialId: string
  onClose: () => void
}

export function ImageLightbox({ images, initialId, onClose }: ImageLightboxProps) {
  const initialIndex = Math.max(0, images.findIndex(i => i.id === initialId))
  const [index, setIndex] = useState(initialIndex)

  const goPrev = useCallback(() => {
    setIndex(i => (i <= 0 ? images.length - 1 : i - 1))
  }, [images.length])

  const goNext = useCallback(() => {
    setIndex(i => (i >= images.length - 1 ? 0 : i + 1))
  }, [images.length])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, goPrev, goNext])

  const current = images[index]
  if (!current) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white"
        aria-label="Close"
      >
        <X size={22} />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-3 sm:left-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Previous image"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-3 sm:right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Next image"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current.url}
        alt=""
        className="max-w-full max-h-[85vh] object-contain rounded-lg"
      />
    </div>
  )
}
