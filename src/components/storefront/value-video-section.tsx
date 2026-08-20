import { youTubeEmbedFromUrl } from '@/lib/youtube'

interface ValueVideoSectionProps {
  valueVideoUrl: string | null | undefined
}

/** Optional free training video block on public shop pages. */
export function ValueVideoSection({ valueVideoUrl }: ValueVideoSectionProps) {
  const embedSrc = youTubeEmbedFromUrl(valueVideoUrl)
  if (!embedSrc) return null

  return (
    <section className="border-b border-neutral-100 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="max-w-3xl mx-auto">
          <div className="relative w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 aspect-video">
            <iframe
              src={embedSrc}
              title="Shop video"
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  )
}
