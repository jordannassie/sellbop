import Link from 'next/link'
import { LogOut, Store } from 'lucide-react'

interface AdminTopBarProps {
  section: string
  searchSlot?: React.ReactNode
}

export function AdminTopBar({ section, searchSlot }: AdminTopBarProps) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-8 py-3">
      <p className="text-xs font-medium capitalize text-neutral-400">
        Admin <span className="mx-1 text-neutral-300">·</span> {section}
      </p>
      <div className="flex items-center gap-3">
        {searchSlot}
        <Link
          href="/api/admin/go-to-dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-black transition-opacity hover:opacity-90"
          style={{ background: '#00E676' }}
        >
          <Store size={14} />
          Go to My Shop
        </Link>
        <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
          Internal
        </span>
        <Link href="/" className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 transition-colors hover:text-black">
          <LogOut size={13} />
          Exit
        </Link>
      </div>
    </div>
  )
}
