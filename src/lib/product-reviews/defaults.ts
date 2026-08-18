export interface ProductReviewItem {
  customer_name: string
  rating: number
  message: string
}

export const DEFAULT_PRODUCT_REVIEWS: ProductReviewItem[] = [
  {
    customer_name: 'Sarah M.',
    rating: 5,
    message: 'Exactly what I needed — clear, simple, and easy to follow from day one.',
  },
  {
    customer_name: 'Jessica T.',
    rating: 5,
    message: 'Finally a plan that fits a busy schedule. Well organized and worth it.',
  },
  {
    customer_name: 'Amanda R.',
    rating: 5,
    message: 'Love how practical this is. I started immediately and already feel on track.',
  },
]

export function resolveProductReviews(reviews: ProductReviewItem[] | null | undefined): ProductReviewItem[] {
  if (reviews && reviews.length > 0) return reviews.slice(0, 3)
  return DEFAULT_PRODUCT_REVIEWS
}

export function averageRating(reviews: ProductReviewItem[]): number {
  if (!reviews.length) return 5
  const total = reviews.reduce((sum, review) => sum + review.rating, 0)
  return Math.round((total / reviews.length) * 10) / 10
}
