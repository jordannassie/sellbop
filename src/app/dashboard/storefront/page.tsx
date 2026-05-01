'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { demoStorefrontRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/dashboard/image-upload'
import { ExternalLink, Copy, Check, Globe2, LayoutTemplate } from 'lucide-react'
import type { BrandingMode } from '@/lib/domain/entities'
import { toast } from 'sonner'
import type { Storefront } from '@/lib/domain/entities'
import { StoreIdentityCard } from '@/components/dashboard/store-identity-card'

export default function StoreProfilePage() {
  const [storefront, setStorefront] = useState<Storefront | null>(null)
  const [title, setTitle]         = useState('')
  const [headline, setHeadline]   = useState('')
  const [bio, setBio]             = useState('')
  const [twitter, setTwitter]     = useState('')
  const [instagram, setInstagram] = useState('')
  const [youtube, setYoutube]     = useState('')
  const [website, setWebsite]     = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [layoutMode, setLayoutMode] = useState<'clean' | 'banner'>('clean')
  const [brandingMode, setBrandingMode] = useState<BrandingMode>('minimal')
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
        setAvatarUrl(s.avatarUrl ?? null)
        setBannerUrl(s.bannerUrl ?? null)
        setLayoutMode((s.bannerUrl ? 'banner' : 'clean') as 'clean' | 'banner')
        setBrandingMode(s.brandingMode ?? 'minimal')
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
    const effectiveBannerUrl = layoutMode === 'banner' && bannerUrl ? bannerUrl : null

    await demoStorefrontRepo.upsert({
      sellerId: DEMO_SELLER_PROFILE.id,
      slug: DEMO_SELLER_PROFILE.slug,
      title,
      headline: headline || null,
      bio: bio || null,
      avatarUrl: avatarUrl ?? null,
      bannerUrl: effectiveBannerUrl,
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
      headerMedia: storefront?.headerMedia ?? 'none',
      headerPhotoUrl: storefront?.headerPhotoUrl ?? null,
      headerVideoUrl: storefront?.headerVideoUrl ?? null,
      published: true,
      brandingMode,
    })

    // Also persist banner to Supabase if configured
    fetch('/api/v5/store-banner', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bannerUrl: effectiveBannerUrl, layoutMode }),
    }).catch(() => { /* best-effort — localStorage is the primary store */ })

    toast.success('Store profile saved.')
    setSaving(false)
  }

  return (
    <div className="max-w-2xl">
      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-black">Store Profile</h1>
        <p className="text-neutral-500 text-sm mt-1">Manage your public store identity.</p>
      </div>

      {/* Store identity preview — shows saved state; left side links to this page (self), actions kept */}
      <StoreIdentityCard className="mb-5" showEditorLink={false} />

      {/* Public URL row */}
      <div className="mb-6 bg-white border border-neutral-200 rounded-xl px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-0.5">Public URL</p>
          <p className="text-sm text-neutral-800 font-mono truncate">/store/{DEMO_SELLER_PROFILE.slug}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={copyLink}
            title="Copy link"
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-neutral-600 border border-neutral-200 hover:bg-neutral-50 transition-colors"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <Link href={storeUrl} target="_blank">
            <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-neutral-600 border border-neutral-200 hover:bg-neutral-50 transition-colors">
              <ExternalLink size={12} /> Open
            </button>
          </Link>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-5">

        {/* ── Store Image ────────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Store Photo</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              {/* Avatar preview — shows uploaded photo or initials fallback */}
              <div
                className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center text-white text-2xl font-black shadow-sm"
                style={{ backgroundColor: storefront?.themeColor ?? '#000000' }}
                aria-hidden="true"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="Store photo"
                    className="w-full h-full object-cover"
                    onError={() => setAvatarUrl(null)}
                  />
                ) : (
                  (title || 'S').charAt(0).toUpperCase()
                )}
              </div>

              {/* Upload widget */}
              <div className="flex-1 min-w-0">
                <ImageUpload
                  value={avatarUrl}
                  onChange={setAvatarUrl}
                  bucket="store-images"
                  ownerId={DEMO_SELLER_PROFILE.id}
                  label=""
                  aspectClass="aspect-square"
                  hint="Square image recommended, 400×400px or larger."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Store Banner / Layout ──────────────────────────── */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><LayoutTemplate size={15} /> Store Layout</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-neutral-700 mb-2">Layout style</p>
              <div className="grid grid-cols-2 gap-3">
                {(['clean', 'banner'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setLayoutMode(mode)}
                    className={`rounded-xl border-2 p-3 text-left transition-colors ${
                      layoutMode === mode
                        ? 'border-black bg-black/5'
                        : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <p className="text-xs font-semibold text-black capitalize">{mode}</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      {mode === 'clean'
                        ? 'Simple header with avatar and name'
                        : 'Full-width banner image above content'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
            {layoutMode === 'banner' && (
              <ImageUpload
                value={bannerUrl}
                onChange={setBannerUrl}
                bucket="store-banners"
                ownerId={DEMO_SELLER_PROFILE.id}
                label="Banner Image"
                aspectClass="aspect-[3/1]"
                hint="Use a wide image, 1200×400px or larger. JPG or PNG."
              />
            )}
          </CardContent>
        </Card>

        {/* ── Store Branding ────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Globe2 size={15} /> Store Branding</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-neutral-500 leading-relaxed">
              Control how SellBop branding appears on your public store page.
            </p>
            <div className="grid grid-cols-1 gap-2">
              {([
                { value: 'minimal',     label: 'Minimal',              desc: 'Make your store feel like your own site — no SellBop header or badge.' },
                { value: 'powered_by',  label: 'Powered by SellBop',   desc: 'Show a small "Powered by SellBop" badge in the footer only.' },
                { value: 'full_header', label: 'Full SellBop header',  desc: 'Show the SellBop navigation bar at the top of your store.' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBrandingMode(opt.value)}
                  className={`rounded-xl border-2 p-3 text-left transition-colors ${
                    brandingMode === opt.value
                      ? 'border-black bg-black/5'
                      : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <p className="text-xs font-semibold text-black">{opt.label}</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Store Info ─────────────────────────────────────── */}
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
