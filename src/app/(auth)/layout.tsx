import Link from 'next/link'
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="h-14 flex items-center px-6 border-b border-neutral-100 bg-white">
        <Link href="/" className="text-base font-bold text-black">Selli</Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">{children}</main>
    </div>
  )
}
