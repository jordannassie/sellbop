interface SectionHeaderProps {
  eyebrow?: string
  title: string
  description?: string
}

export function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <div className="mb-10">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400 mb-2">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl sm:text-3xl font-bold text-black">{title}</h2>
      {description && (
        <p className="text-neutral-500 text-sm mt-2 leading-relaxed max-w-2xl">{description}</p>
      )}
    </div>
  )
}
