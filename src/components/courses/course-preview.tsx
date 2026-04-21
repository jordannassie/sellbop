import { CheckCircle2, Clock, BookOpen, ArrowRight } from 'lucide-react'

interface Lesson {
  number: number
  title: string
}

interface Module {
  number: number
  title: string
  lessons: Lesson[]
}

interface CoursePreviewProps {
  courseTitle: string
  modules: Module[]
  totalLessons: number
  totalDuration: string
  level: string
  free: boolean
}

export function CoursePreview({
  courseTitle,
  modules,
  totalLessons,
  totalDuration,
  level,
  free,
}: CoursePreviewProps) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-neutral-50 border-b border-neutral-200 px-6 py-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Course Preview</p>
        <h3 className="text-base font-bold text-black">{courseTitle}</h3>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Module list */}
        <div className="flex-1 divide-y divide-neutral-100">
          {modules.map(mod => (
            <div key={mod.number} className="px-6 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2.5">
                Module {mod.number} — {mod.title}
              </p>
              <ul className="space-y-1.5">
                {mod.lessons.map(lesson => (
                  <li key={lesson.number} className="flex items-center gap-2.5 text-sm text-neutral-700">
                    <span className="w-5 h-5 rounded-full border border-neutral-200 flex items-center justify-center text-[10px] font-bold text-neutral-400 flex-shrink-0">
                      {lesson.number}
                    </span>
                    {lesson.title}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Course summary sidebar */}
        <div className="lg:w-52 border-t lg:border-t-0 lg:border-l border-neutral-200 bg-neutral-50 p-6 flex flex-col gap-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <BookOpen size={14} className="text-neutral-400" />
              <span className="text-neutral-600 font-medium">{totalLessons} lessons</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock size={14} className="text-neutral-400" />
              <span className="text-neutral-600 font-medium">{totalDuration}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 size={14} className="text-neutral-400" />
              <span className="text-neutral-600 font-medium">{level}</span>
            </div>
          </div>

          {free && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-center">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Free</p>
            </div>
          )}

          <button className="w-full flex items-center justify-center gap-1.5 bg-black text-white text-xs font-semibold py-2.5 rounded-xl hover:bg-neutral-800 transition-colors">
            Start Course <ArrowRight size={11} />
          </button>
        </div>
      </div>
    </div>
  )
}
