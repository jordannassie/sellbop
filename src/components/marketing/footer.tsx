import Link from 'next/link'
export function MarketingFooter() {
  return (
    <footer className="border-t border-neutral-100 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-black">Selli</span>
          <span className="text-neutral-300">·</span>
          <span className="text-xs text-neutral-500">Sell anything in minutes.</span>
        </div>
        <nav className="flex items-center gap-5 flex-wrap justify-center">
          {[['Pricing', '/pricing'], ['Demo', '/demo'], ['Login', '/login'], ['Sign Up', '/signup'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([label, href]) => (
            <Link key={href} href={href} className="text-xs text-neutral-500 hover:text-black transition-colors">{label}</Link>
          ))}
        </nav>
        <p className="text-xs text-neutral-400">© {new Date().getFullYear()} Selli</p>
      </div>
    </footer>
  )
}
