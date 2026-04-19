import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  change?: string
  positive?: boolean
  icon?: ReactNode
  className?: string
}

export function StatCard({ label, value, change, positive, icon, className }: StatCardProps) {
  return (
    <div className={cn('bg-white border border-neutral-200 rounded-xl p-5', className)}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-neutral-500 font-medium">{label}</p>
        {icon && <span className="text-neutral-400">{icon}</span>}
      </div>
      <p className="text-2xl font-bold text-black">{value}</p>
      {change && (
        <p className={cn('text-xs mt-1', positive ? 'text-green-600' : 'text-red-500')}>
          {change}
        </p>
      )}
    </div>
  )
}
