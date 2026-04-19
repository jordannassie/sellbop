import { cn } from '@/lib/utils'
import { forwardRef, type SelectHTMLAttributes } from 'react'
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> { label?: string; error?: string; hint?: string; options: { value: string; label: string }[] }
const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, label, error, hint, id, options, ...props }, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">{label}</label>}
      <select ref={ref} id={inputId} className={cn('w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent', className)} {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && !error && <p className="text-xs text-neutral-500">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
})
Select.displayName = 'Select'
export { Select }
