import Link from 'next/link'
import { SellBopLogo } from '@/components/ui/sellbop-logo'
import { Button } from '@/components/ui/button'
import { XCircle } from 'lucide-react'

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-white border-b border-neutral-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <Link href="/"><SellBopLogo size="lg" /></Link>
        </div>
      </div>
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle size={28} className="text-neutral-400" />
          </div>
          <h1 className="text-2xl font-bold text-black mb-2">Checkout cancelled</h1>
          <p className="text-neutral-500 mb-8">You can go back and try again anytime.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/"><Button variant="secondary">Go Home</Button></Link>
          </div>
        </div>
      </div>
    </div>
  )
}
