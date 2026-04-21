import { Clock, BookOpen, ArrowRight } from 'lucide-react'

interface CourseCardProps {
  label: string
  title: string
  description: string
  lessonCount: number
  duration: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  /** Show the full featured layout with module chips */
  featured?: boolean
  modules?: string[]
  variant?: 'grid' | 'library'
}

const LEVEL_COLORS: Record<string, string> = {
  Beginner: 'bg-emerald-50 text-emerald-700',
  Intermediate: 'bg-amber-50 text-amber-700',
  Advanced: 'bg-rose-50 text-rose-700',
}

export function CourseCard({
  label,
  title,
  description,
  lessonCount,
  duration,
  level,
  featured = false,
  modules = [],
  variant = 'grid',
}: CourseCardProps) {
  if (featured) {
    return (
      <div className="group bg-white border border-neutral-200 rounded-2xl p-7 hover:shadow-md hover:border-neutral-300 transition-all flex flex-col gap-5 h-full">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 border border-neutral-200 rounded-md px-2 py-1">
            {label}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${LEVEL_COLORS[level]}`}>
            {level}
          </span>
        </div>

        {/* Title + description */}
        <div className="flex-1 space-y-2">
          <h3 className="text-xl font-bold text-black leading-snug">{title}</h3>
          <p className="text-sm text-neutral-500 leading-relaxed">{description}</p>
        </div>

        {/* Module chips */}
        {modules.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Includes</p>
            <div className="flex flex-wrap gap-1.5">
              {modules.map(m => (
                <span key={m} className="text-xs text-neutral-600 bg-neutral-100 border border-neutral-200 rounded-md px-2.5 py-1">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Meta + CTA */}
        <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
          <div className="flex items-center gap-4 text-xs text-neutral-400">
            <span className="flex items-center gap-1"><BookOpen size={11} /> {lessonCount} lessons</span>
            <span className="flex items-center gap-1"><Clock size={11} /> {duration}</span>
          </div>
          <button className="flex items-center gap-1.5 text-xs font-semibold text-black bg-neutral-100 hover:bg-black hover:text-white px-3.5 py-2 rounded-lg transition-colors">
            View Course <ArrowRight size={11} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-sm hover:border-neutral-300 transition-all flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 border border-neutral-200 rounded-md px-2 py-0.5">
          {label}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${LEVEL_COLORS[level]}`}>
          {level}
        </span>
      </div>

      <div className="flex-1 space-y-1.5">
        <h4 className="text-sm font-bold text-black leading-snug">{title}</h4>
        <p className="text-xs text-neutral-500 leading-relaxed">{description}</p>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
        <div className="flex items-center gap-3 text-[11px] text-neutral-400">
          <span className="flex items-center gap-1"><BookOpen size={10} /> {lessonCount} lessons</span>
          <span className="flex items-center gap-1"><Clock size={10} /> {duration}</span>
        </div>
        <button className="text-[11px] font-semibold text-black hover:underline underline-offset-2 flex items-center gap-1">
          Open Course <ArrowRight size={10} />
        </button>
      </div>
    </div>
  )
}
