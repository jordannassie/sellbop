import { ArrowRight } from 'lucide-react'

interface PathCardProps {
  title: string
  description: string
  lessonCount: number
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  icon: React.ReactNode
}

export function PathCard({ title, description, lessonCount, level, icon }: PathCardProps) {
  return (
    <div className="group bg-white border border-neutral-200 rounded-2xl p-7 hover:shadow-md hover:border-neutral-300 transition-all flex flex-col gap-5">
      <div className="w-11 h-11 rounded-xl bg-neutral-100 flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-colors">
        {icon}
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{level}</span>
          <span className="text-neutral-200">·</span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{lessonCount} lessons</span>
        </div>
        <h3 className="text-lg font-bold text-black leading-snug">{title}</h3>
        <p className="text-sm text-neutral-500 leading-relaxed">{description}</p>
      </div>
      <button className="flex items-center gap-2 text-sm font-medium text-black hover:gap-3 transition-all w-fit">
        View Path <ArrowRight size={14} />
      </button>
    </div>
  )
}
