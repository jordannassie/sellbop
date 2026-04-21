import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { SellBopLogo } from '@/components/ui/sellbop-logo'
export default function CancelPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-white border-b border-neutral-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <SellBopLogo size="lg" />
        </div>
      </div>
      <div className="max-w-md mx-auto text-center py-16 px-4">
        <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-6">
          <X size={22} className="text-neutral-500" />
        </div>
        <h1 className="text-2xl font-bold text-black mb-2">Checkout cancelled</h1>
        <p className="text-neutral-500 text-sm mb-8">No charges were made. Your cart is still saved.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/"><Button variant="secondary">Go Home</Button></Link>
          <Link href="/demo"><Button variant="ghost">View Products</Button></Link>
        </div>
      </div>
    </div>
  )
}
