'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { demoStorefrontRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ExternalLink, Copy, Check, Layers } from 'lucide-react'
import { toast } from 'sonner'
import type { Storefront } from '@/lib/domain/entities'

export default function StoreProfilePage() {
  const [storefront, setStorefront] = useState<Storefront | null>(null)
  const [title, setTitle]         = useState('')
  const [headline, setHeadline]   = useState('')
  const [bio, setBio]             = useState('')
  const [twitter, setTwitter]     = useState('')
  const [instagram, setInstagram] = useState('')
  const [youtube, setYoutube]     = useState('')
  const [website, setWebsite]     = useState('')
  const [saving, setSaving]       = useState(false)
  const [copied, setCopied]       = useState(false)

  const storeUrl  = `/store/${DEMO_SELLER_PROFILE.slug}`
  const publicUrl = typeof window !== 'undefined'
    ? window.location.origin + storeUrl
    : storeUrl

  useEffect(() => {
    demoStorefrontRepo.findBySellerId(DEMO_SELLER_PROFILE.id).then(s => {
      setStorefront(s)
      if (s) {
        setTitle(s.title)
        setHeadline(s.headline ?? '')
        setBio(s.bio ?? '')
        setTwitter(s.socialLinks.twitter ?? '')
        setInstagram(s.socialLinks.instagram ?? '')
        setYoutube(s.socialLinks.youtube ?? '')
        setWebsite(s.socialLinks.website ?? '')
      }
    })
  }, [])

  function copyLink() {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true)
      toast.success('Link copied!')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await demoStorefrontRepo.upsert({
      sellerId: DEMO_SELLER_PROFILE.id,
      slug: DEMO_SELLER_PROFILE.slug,
      title,
      headline: headline || null,
      bio: bio || null,
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
      socialLinks: {
        twitter:   twitter   || undefined,
        instagram: instagram || undefined,
        youtube:   youtube   || undefined,
        website:   website   || undefined,
      },
      published: true,
    })
    toast.success('Store profile saved.')
    setSaving(false)
  }

  return (
    <div className="max-w-2xl">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-black">Store Profile</h1>
          <p className="text-neutral-500 text-sm mt-1">Manage your public store identity.</p>
        </div>
        <Link href={storeUrl} target="_blank">
          <Button variant="secondary" size="sm">
            <ExternalLink size={13} /> View Store
          </Button>
        </Link>
      </div>

      {/* Public store card */}
      <div className="mb-6 bg-white border border-neutral-200 rounded-xl p-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-neutral-500 mb-1">Public URL</p>
          <p className="text-sm text-neutral-900 font-mono truncate">/store/{DEMO_SELLER_PROFILE.slug}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={copyLink}
            title="Copy link"
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-neutral-600 border border-neutral-200 hover:bg-neutral-50 transition-colors"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <Link href={storeUrl} target="_blank">
            <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-neutral-600 border border-neutral-200 hover:bg-neutral-50 transition-colors">
              <ExternalLink size={12} /> Open
            </button>
          </Link>
        </div>
      </div>

      {/* Store Editor CTA — light/subtle */}
      <div className="mb-6 bg-neutral-50 border border-neutral-200 rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-black">Open Store Editor</p>
          <p className="text-xs text-neutral-500 mt-0.5">Arrange sections, choose featured products, and customise your theme.</p>
        </div>
        <Link href="/dashboard/store-editor" className="shrink-0">
          <Button variant="secondary" size="sm">
            <Layers size={13} /> Store Editor
          </Button>
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-5">
        {/* Store Info */}
        <Card>
          <CardHeader><CardTitle>Store Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Store Name"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Alex Creates"
              hint="Shown as your public store name."
            />
            <Input
              label="Headline"
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              placeholder="Short tagline shown below your name…"
            />
            <Textarea
              label="Bio"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell buyers who you are and what you create…"
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader><CardTitle>Social Links</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Twitter / X"
              value={twitter}
              onChange={e => setTwitter(e.target.value)}
              placeholder="https://twitter.com/yourhandle"
              type="url"
            />
            <Input
              label="Instagram"
              value={instagram}
              onChange={e => setInstagram(e.target.value)}
              placeholder="https://instagram.com/yourhandle"
              type="url"
            />
            <Input
              label="YouTube"
              value={youtube}
              onChange={e => setYoutube(e.target.value)}
              placeholder="https://youtube.com/@yourchannel"
              type="url"
            />
            <Input
              label="Website"
              value={website}
              onChange={e => setWebsite(e.target.value)}
              placeholder="https://yoursite.com"
              type="url"
            />
          </CardContent>
        </Card>

        <Button type="submit" loading={saving}>Save Store Profile</Button>
      </form>
    </div>
  )
}
