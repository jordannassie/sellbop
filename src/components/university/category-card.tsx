import { ArrowRight } from 'lucide-react'

interface CategoryCardProps {
  title: string
  description: string
  lessonCount: number
  icon: React.ReactNode
}

export function CategoryCard({ title, description, lessonCount, icon }: CategoryCardProps) {
  return (
    <div className="group flex items-start gap-4 bg-white border border-neutral-200 rounded-xl p-5 hover:border-neutral-300 hover:shadow-sm transition-all cursor-pointer">
      <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-black group-hover:text-white transition-colors flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-black">{title}</p>
            <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{description}</p>
            <p className="text-xs text-neutral-400 mt-1.5">{lessonCount} lessons</p>
          </div>
          <ArrowRight size={14} className="text-neutral-300 group-hover:text-black transition-colors flex-shrink-0 mt-0.5" />
        </div>
      </div>
    </div>
  )
}
