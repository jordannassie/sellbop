import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  averageRating,
  resolveProductReviews,
  type ProductReviewItem,
} from '@/lib/product-reviews/defaults'

function StarRating({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < Math.round(rating)
        return (
          <Star
            key={index}
            size={size}
            className={cn(
              filled ? 'fill-amber-400 text-amber-400' : 'fill-neutral-200 text-neutral-200',
            )}
          />
        )
      })}
    </div>
  )
}

interface ProductReviewsCardProps {
  reviews?: ProductReviewItem[] | null
  className?: string
}

export function ProductReviewsCard({ reviews, className }: ProductReviewsCardProps) {
  const displayReviews = resolveProductReviews(reviews)
  const rating = averageRating(displayReviews)

  return (
    <div className={cn('rounded-2xl border border-neutral-200 bg-white p-5', className)}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-semibold text-neutral-900">Customer reviews</p>
          <p className="text-xs text-neutral-500 mt-0.5">
            {rating.toFixed(1)} · {displayReviews.length} five-star reviews
          </p>
        </div>
        <StarRating rating={rating} size={14} />
      </div>

      <div className="space-y-3">
        {displayReviews.map(review => (
          <div key={`${review.customer_name}-${review.message}`} className="border-t border-neutral-100 pt-3 first:border-t-0 first:pt-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-xs font-semibold text-neutral-800">{review.customer_name}</p>
              <StarRating rating={review.rating} size={11} />
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed line-clamp-3">{review.message}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
