'use client'
import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'brand'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shrink-0',
        {
          'bg-black text-white hover:bg-neutral-800 focus-visible:ring-black': variant === 'primary',
          'bg-white text-black border border-neutral-200 hover:bg-neutral-50 focus-visible:ring-neutral-300': variant === 'secondary',
          'text-neutral-600 hover:text-black hover:bg-neutral-100 focus-visible:ring-neutral-300': variant === 'ghost',
          'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500': variant === 'danger',
          'border border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50': variant === 'outline',
          'bg-white text-emerald-700 border border-emerald-500 hover:bg-emerald-50 focus-visible:ring-emerald-400': variant === 'brand',
        },
        {
          'text-xs px-2.5 py-1.5': size === 'xs',
          'text-sm px-3 py-1.5': size === 'sm',
          'text-sm px-4 py-2': size === 'md',
          'text-base px-6 py-3': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
)
Button.displayName = 'Button'
export { Button }
