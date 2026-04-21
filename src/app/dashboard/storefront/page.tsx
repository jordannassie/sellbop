'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { demoStorefrontRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import type { Storefront } from '@/lib/domain/entities'

export default function StorefrontPage() {
  const [storefront, setStorefront] = useState<Storefront | null>(null)
  const [title, setTitle] = useState('')
  const [bio, setBio] = useState('')
  const [twitter, setTwitter] = useState('')
  const [instagram, setInstagram] = useState('')
  const [website, setWebsite] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    demoStorefrontRepo.findBySellerId(DEMO_SELLER_PROFILE.id).then(s => {
      setStorefront(s)
      if (s) {
        setTitle(s.title); setBio(s.bio ?? '')
        setTwitter(s.socialLinks.twitter ?? ''); setInstagram(s.socialLinks.instagram ?? '')
        setWebsite(s.socialLinks.website ?? '')
      }
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await demoStorefrontRepo.upsert({
      sellerId: DEMO_SELLER_PROFILE.id,
      slug: DEMO_SELLER_PROFILE.slug,
      title, bio: bio || null,
      headline: storefront?.headline ?? null,
      avatarUrl: null,
      bannerUrl: null,
      featuredProductIds: storefront?.featuredProductIds ?? [],
      productOrder: storefront?.productOrder ?? [],
      hiddenProductIds: storefront?.hiddenProductIds ?? [],
      themeColor: storefront?.themeColor ?? '#000000',
      buttonStyle: storefront?.buttonStyle ?? 'rounded',
      cardStyle: storefront?.cardStyle ?? 'soft_shadow',
      headerLayout: storefront?.headerLayout ?? 'left_avatar',
      cardDensity: storefront?.cardDensity ?? 'comfortable',
      sectionOrder: storefront?.sectionOrder ?? [],
      sectionVisibility: storefront?.sectionVisibility ?? {},
      socialLinks: { twitter: twitter || undefined, instagram: instagram || undefined, website: website || undefined },
      published: true,
    })
    toast.success('Storefront saved.')
    setSaving(false)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-black">Storefront</h1>
          <p className="text-neutral-500 text-sm mt-1">Your public creator store.</p>
        </div>
        <Link href={`/store/${DEMO_SELLER_PROFILE.slug}`} target="_blank">
          <Button variant="secondary" size="sm"><ExternalLink size={13} />View Store</Button>
        </Link>
      </div>

      {/* Banner pointing to new Store Editor */}
      <div className="mb-6 p-4 bg-black text-white rounded-xl flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">✨ Try the new Store Editor</p>
          <p className="text-xs text-neutral-300 mt-0.5">Visual editing, live preview, drag-and-drop sections.</p>
        </div>
        <Link href="/dashboard/store-editor">
          <Button size="sm" className="bg-white text-black hover:bg-neutral-100 text-xs shrink-0">
            Open Editor
          </Button>
        </Link>
      </div>

      <div className="mb-4 p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-sm">
        <span className="text-neutral-500">Public URL: </span>
        <code className="text-black">/store/{DEMO_SELLER_PROFILE.slug}</code>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Display Name" value={title} onChange={e => setTitle(e.target.value)} placeholder="Alex Creates" />
            <Textarea label="Bio" value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell buyers who you are and what you sell." rows={3} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Social Links</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Twitter / X" value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="https://twitter.com/yourhandle" type="url" />
            <Input label="Instagram" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="https://instagram.com/yourhandle" type="url" />
            <Input label="Website" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yoursite.com" type="url" />
          </CardContent>
        </Card>
        <Button type="submit" loading={saving}>Save Storefront</Button>
      </form>
    </div>
  )
}
