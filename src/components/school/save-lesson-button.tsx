'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'

interface SaveLessonButtonProps {
  lessonId: string
  variant?: 'default' | 'icon'
  className?: string
}

export function SaveLessonButton({ lessonId, variant = 'default', className = '' }: SaveLessonButtonProps) {
  const { session } = useAuth()
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!session) {
      setSaved(false)
      return
    }

    fetch('/api/school/my-list')
      .then(r => (r.ok ? r.json() : { lessonIds: [] }))
      .then(data => setSaved((data.lessonIds ?? []).includes(lessonId)))
      .catch(() => setSaved(false))
  }, [session, lessonId])

  async function toggleSave() {
    if (!session) {
      toast.message('Create a free SellBop account to save lessons to My List.', {
        action: {
          label: 'Sign Up Free',
          onClick: () => router.push('/signup'),
        },
      })
      return
    }

    setLoading(true)
    try {
      if (saved) {
        const res = await fetch(`/api/school/my-list?lessonId=${encodeURIComponent(lessonId)}`, {
          method: 'DELETE',
        })
        if (!res.ok) throw new Error()
        setSaved(false)
        toast.success('Removed from My List.')
      } else {
        const res = await fetch('/api/school/my-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId }),
        })
        if (!res.ok) throw new Error()
        setSaved(true)
        toast.success('Saved to My List.')
      }
    } catch {
      toast.error('Could not update My List.')
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={e => {
          e.preventDefault()
          e.stopPropagation()
          toggleSave()
        }}
        disabled={loading}
        className={`flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white/95 text-neutral-600 shadow-sm transition-colors hover:border-neutral-300 hover:text-black disabled:opacity-50 ${className}`}
        aria-label={saved ? 'Remove from My List' : 'Save to My List'}
        title={saved ? 'Saved' : 'My List'}
      >
        {saved ? <Check size={14} className="text-emerald-600" /> : <Plus size={14} />}
      </button>
    )
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={toggleSave}
      loading={loading}
      className={className}
    >
      {saved ? (
        <>
          <Check size={14} className="text-emerald-600" /> Saved
        </>
      ) : (
        <>
          <Plus size={14} /> My List
        </>
      )}
    </Button>
  )
}

export function MyListLink({ count }: { count?: number }) {
  const { session } = useAuth()

  if (!session) return null

  return (
    <Link
      href="/school?myList=1"
      className="text-sm font-medium text-neutral-600 hover:text-black transition-colors"
    >
      My List{count != null && count > 0 ? ` (${count})` : ''}
    </Link>
  )
}
