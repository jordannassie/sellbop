import { SellBopLogo } from '@/components/ui/sellbop-logo'
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="h-14 flex items-center px-6 border-b border-neutral-100 bg-white">
        <SellBopLogo size="lg" />
      </header>
      <main className="flex-1 flex items-center justify-center p-6">{children}</main>
    </div>
  )
}
