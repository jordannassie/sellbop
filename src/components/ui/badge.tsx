import { cn } from '@/lib/utils'
import { type HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'neutral' | 'info'
}
export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', {
      'bg-neutral-900 text-white': variant === 'default',
      'bg-green-50 text-green-700 border border-green-200': variant === 'success',
      'bg-yellow-50 text-yellow-700 border border-yellow-200': variant === 'warning',
      'bg-red-50 text-red-700 border border-red-200': variant === 'danger',
      'bg-neutral-100 text-neutral-600 border border-neutral-200': variant === 'neutral',
      'bg-blue-50 text-blue-700 border border-blue-200': variant === 'info',
    }, className)} {...props} />
  )
}
