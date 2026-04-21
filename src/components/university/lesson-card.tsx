import { Clock, ArrowRight } from 'lucide-react'

interface LessonCardProps {
  category: string
  title: string
  description: string
  duration: string
}

export function LessonCard({ category, title, description, duration }: LessonCardProps) {
  return (
    <div className="group bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-sm hover:border-neutral-300 transition-all flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{category}</span>
        <span className="flex items-center gap-1 text-[11px] text-neutral-400">
          <Clock size={11} />
          {duration}
        </span>
      </div>
      <div className="flex-1 space-y-1.5">
        <h4 className="text-sm font-semibold text-black leading-snug group-hover:underline underline-offset-2">{title}</h4>
        <p className="text-xs text-neutral-500 leading-relaxed">{description}</p>
      </div>
      <button className="flex items-center gap-1.5 text-xs font-medium text-black w-fit">
        Open Lesson <ArrowRight size={12} />
      </button>
    </div>
  )
}
