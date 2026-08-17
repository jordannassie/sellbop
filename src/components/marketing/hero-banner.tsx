'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const BANNERS = [
  {
    src: 'https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/images/banners/ChatGPT%20Image%20Aug%2016,%202026,%2006_54_46%20PM%20(8).png',
    alt: 'Turn PDFs Into Sales',
  },
  {
    src: 'https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/images/banners/ChatGPT%20Image%20Aug%2016,%202026,%2006_54_44%20PM%20(2).png',
    alt: 'Make Products Pay',
  },
  {
    src: 'https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/images/banners/ChatGPT%20Image%20Aug%2016,%202026,%2006_54_45%20PM%20(6).png',
    alt: 'Digital Sales Simplified',
  },
  {
    src: 'https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/images/banners/ChatGPT%20Image%20Aug%2016,%202026,%2006_54_46%20PM%20(7).png',
    alt: 'Start Selling Today',
  },
]

const INTERVAL_MS = 4500

export function HeroBanner() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [transitioning, setTransitioning] = useState(false)

  const goTo = useCallback((index: number) => {
    if (transitioning) return
    setTransitioning(true)
    setTimeout(() => {
      setCurrent(index)
      setTransitioning(false)
    }, 300)
  }, [transitioning])

  const next = useCallback(() => {
    goTo((current + 1) % BANNERS.length)
  }, [current, goTo])

  const prev = useCallback(() => {
    goTo((current - 1 + BANNERS.length) % BANNERS.length)
  }, [current, goTo])

  useEffect(() => {
    if (paused) return
    const t = setInterval(next, INTERVAL_MS)
    return () => clearInterval(t)
  }, [paused, next])

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl bg-black"
      style={{ aspectRatio: '16/9' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {BANNERS.map((banner, i) => (
        <div
          key={banner.src}
          className="absolute inset-0 transition-opacity duration-500"
          style={{ opacity: i === current ? (transitioning ? 0 : 1) : 0, zIndex: i === current ? 1 : 0 }}
          aria-hidden={i !== current}
        >
          <Image
            src={banner.src}
            alt={banner.alt}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 90vw"
            priority={i === 0}
            unoptimized
          />
        </div>
      ))}

      {/* Prev/Next */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight size={18} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="transition-all duration-300 rounded-full"
            style={{
              width: i === current ? 20 : 6,
              height: 6,
              background: i === current ? '#00E676' : 'rgba(255,255,255,0.5)',
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Progress bar */}
      {!paused && (
        <div className="absolute bottom-0 left-0 right-0 z-10 h-0.5 bg-white/10">
          <div
            key={`${current}-progress`}
            className="h-full bg-emerald-500"
            style={{
              animation: `progressBar ${INTERVAL_MS}ms linear forwards`,
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes progressBar {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  )
}
