'use client'
/**
 * AiSkeleton — shimmer skeleton shown below the AIGenerating spinner
 * while the AI builds store/product content. Uses Tailwind animate-pulse.
 */
import { cn } from '@/lib/utils'

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded bg-neutral-200',
        className,
      )}
    />
  )
}

export function AiSkeleton() {
  return (
    <div className="mt-2 space-y-3">

      {/* Store summary card */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="mb-4 flex items-start gap-3">
          <Bone className="h-14 w-14 flex-shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2 pt-1">
            <Bone className="h-5 w-44" />
            <Bone className="h-3.5 w-60" />
            <Bone className="h-3 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 border-t border-neutral-100 pt-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="space-y-1.5">
              <Bone className="h-2.5 w-12" />
              <Bone className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Product description */}
      <div className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4">
        <Bone className="mb-3 h-3 w-28" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-11/12" />
        <Bone className="h-4 w-4/5" />
        <Bone className="h-4 w-9/12" />
      </div>

      {/* Pricing */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <Bone className="mb-3 h-3 w-16" />
        <Bone className="h-8 w-28" />
      </div>

      {/* FAQ */}
      <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
        <Bone className="h-3 w-8" />
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="space-y-1.5 border-b border-neutral-100 pb-3 last:border-0 last:pb-0"
          >
            <Bone className="h-4 w-3/4" />
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-5/6" />
          </div>
        ))}
      </div>

      {/* Launch copy */}
      <div className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4">
        <Bone className="mb-3 h-3 w-24" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-10/12" />
      </div>

    </div>
  )
}
