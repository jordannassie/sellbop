'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'

export function DemoLoginButtons() {
  const { signIn } = useAuth()
  const router = useRouter()
  const [loadingCreator, setLoadingCreator] = useState(false)
  const [loadingBuyer, setLoadingBuyer] = useState(false)

  async function loginAs(email: string, setLoading: (v: boolean) => void, dest: string) {
    setLoading(true)
    try {
      await signIn(email, 'demo123')
      router.push(dest)
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="text-neutral-500">Creator: </span>
          <code className="text-black">creator@sellbop.demo</code>
          <span className="text-neutral-400"> / </span>
          <code className="text-black">demo123</code>
        </div>
        <Button size="xs" loading={loadingCreator} onClick={() => loginAs('creator@sellbop.demo', setLoadingCreator, '/dashboard')}>
          Log in →
        </Button>
      </div>
      <div className="flex items-center justify-between text-sm border-t border-neutral-100 pt-2">
        <div>
          <span className="text-neutral-500">Buyer: </span>
          <code className="text-black">buyer@sellbop.demo</code>
          <span className="text-neutral-400"> / </span>
          <code className="text-black">demo123</code>
        </div>
        <Button size="xs" variant="secondary" loading={loadingBuyer} onClick={() => loginAs('buyer@sellbop.demo', setLoadingBuyer, '/purchases')}>
          Log in →
        </Button>
      </div>
    </div>
  )
}
