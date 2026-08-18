'use client'

interface YoutubeEmbedProps {
  videoId: string
  title: string
  className?: string
}

export function YoutubeEmbed({ videoId, title, className = '' }: YoutubeEmbedProps) {
  return (
    <div className={`relative w-full overflow-hidden rounded-2xl border border-neutral-200 bg-black aspect-video ${className}`}>
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  )
}

interface YoutubeThumbnailProps {
  videoId: string
  title: string
  thumbnailUrl?: string | null
  onClick?: () => void
  className?: string
  showPlay?: boolean
}

export function YoutubeThumbnail({
  videoId,
  title,
  thumbnailUrl,
  onClick,
  className = '',
  showPlay = true,
}: YoutubeThumbnailProps) {
  const src = thumbnailUrl ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative block w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 aspect-video text-left ${className}`}
      aria-label={`Play ${title}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
      {showPlay && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-lg sm:h-16 sm:w-16">
            <span className="ml-1 block h-0 w-0 border-y-[10px] border-y-transparent border-l-[16px] border-l-black sm:border-y-[12px] sm:border-l-[18px]" />
          </span>
        </span>
      )}
    </button>
  )
}

export function YoutubeAttribution({ creator, videoTitle }: { creator: string; videoTitle: string }) {
  return (
    <p className="text-xs text-neutral-500 leading-relaxed">
      Video by <span className="font-medium text-neutral-700">{creator}</span> on YouTube:{' '}
      <span className="italic">&ldquo;{videoTitle}&rdquo;</span>. SellBop curates this lesson; we did not create this video.
    </p>
  )
}

export function YoutubeIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`h-3.5 w-3.5 shrink-0 ${className}`} fill="currentColor">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.7 15.5V8.5L15.8 12l-6.1 3.5z" />
    </svg>
  )
}
