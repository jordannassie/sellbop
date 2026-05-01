'use client'
import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { demoStorefrontRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AiImagePicker } from '@/components/ai/ai-image-picker'
import { LinkField } from '@/components/dashboard/link-field'
import { ExternalLink, Copy, Check, Globe2, LayoutTemplate, Loader2 } from 'lucide-react'
import type { BrandingMode, Storefront } from '@/lib/domain/entities'
import { toast } from 'sonner'
import { StoreIdentityCard } from '@/components/dashboard/store-identity-card'
import { useAuth } from '@/context/auth-context'
import { useUserStore } from '@/hooks/use-user-store'

export default function StoreProfilePage() {
  const { session } = useAuth()
  const { store, loading: storeLoading, isDemo, saveStore } = useUserStore()

  // ── Form state ──────────────────────────────────────────────
  const [storefront, setStorefront] = useState<Storefront | null>(null)
  const [title, setTitle]           = useState('')
  const [headline, setHeadline]     = useState('')
  const [bio, setBio]               = useState('')
  // draftSlug — what the user is editing; only used for public URL after save
  const [draftSlug, setDraftSlug]   = useState('')
  // savedSlug — last persisted value; Copy/Open always use this
  const [savedSlug, setSavedSlug]   = useState('')
  const [twitter, setTwitter]       = useState('')
  const [instagram, setInstagram]   = useState('')
  const [youtube, setYoutube]       = useState('')
  const [website, setWebsite]       = useState('')
  const [avatarUrl, setAvatarUrl]   = useState<string | null>(null)
  const [bannerUrl, setBannerUrl]   = useState<string | null>(null)
  const [layoutMode, setLayoutMode] = useState<'clean' | 'banner'>('clean')
  const [brandingMode, setBrandingMode] = useState<BrandingMode>('minimal')
  const [saving, setSaving]         = useState(false)
  const [copied, setCopied]         = useState(false)

  // Gate: only initialise form state once (avoids re-init on Supabase refetch)
  const initialised = useRef(false)

  // Upload paths use the real auth user ID so files land in the correct folder
  const uploadOwnerId = session?.userId ?? DEMO_SELLER_PROFILE.id

  // ── Derived URLs — always use savedSlug for public-facing links ─────────
  const effectiveSavedSlug = savedSlug || store?.slug || DEMO_SELLER_PROFILE.slug
  const storeUrl  = `/store/${effectiveSavedSlug}`
  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${storeUrl}`
    : storeUrl
  const hasUnsavedLink = draftSlug !== '' && draftSlug !== savedSlug

  // ── Owner param for store-link availability check ───────────
  // The availability API checks `owner_user_id === ownerId`, so we pass
  // the real Supabase user UUID (session.userId) or fall back to the demo
  // seller ID so the "current owner keeps their link" logic still works.
  const storeLinkOwnerParam = {
    key: 'ownerId',
    value: session?.userId ?? DEMO_SELLER_PROFILE.userId,
  }

  // ── Initialise form from store + localStorage ───────────────
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (storeLoading || initialised.current) return
    initialised.current = true

    // Basic fields: Supabase store row (or demo fallback StoreRow)
    if (store) {
      setTitle(store.name)
      setHeadline(store.headline ?? '')
      setBio(store.bio ?? '')
      setDraftSlug(store.slug)
      setSavedSlug(store.slug)
      setAvatarUrl(store.avatar_url ?? null)
      setBannerUrl(store.banner_url ?? null)
      setLayoutMode(store.banner_url ? 'banner' : 'clean')
    }

    // Extended fields stored only in localStorage (social links, theme, branding)
    demoStorefrontRepo.findBySellerId(DEMO_SELLER_PROFILE.id).then(s => {
      setStorefront(s)
      if (s) {
        setBrandingMode(s.brandingMode ?? 'minimal')
        setTwitter(s.socialLinks?.twitter ?? '')
        setInstagram(s.socialLinks?.instagram ?? '')
        setYoutube(s.socialLinks?.youtube ?? '')
        setWebsite(s.socialLinks?.website ?? '')

        // In pure-demo mode (no Supabase), also use localStorage for basic fields
        if (isDemo) {
          setTitle(s.title)
          setHeadline(s.headline ?? '')
          setBio(s.bio ?? '')
          setDraftSlug(s.slug)
          setSavedSlug(s.slug)
          setAvatarUrl(s.avatarUrl ?? null)
          setBannerUrl(s.bannerUrl ?? null)
          setLayoutMode(s.bannerUrl ? 'banner' : 'clean')
        }
      }
    })
  }, [storeLoading, store, isDemo])
  /* eslint-enable react-hooks/set-state-in-effect */

  // ── Auto-save store photo (avatar) ──────────────────────────
  // Called immediately when the user picks or generates a new store photo so
  // it persists before they click "Save Store Profile".
  async function handleStoreAvatarChange(url: string) {
    setAvatarUrl(url)

    if (!isDemo) {
      const err = await saveStore({ avatar_url: url })
      if (err) {
        toast.error('Store photo could not be saved. Click Save Profile to try again.')
      } else {
        toast.success('Store photo updated.')
      }
      return
    }

    // Demo mode: patch localStorage so the image persists across refresh
    try {
      const effectiveBannerUrl = layoutMode === 'banner' && bannerUrl ? bannerUrl : null
      await demoStorefrontRepo.upsert({
        sellerId:    DEMO_SELLER_PROFILE.id,
        slug:        draftSlug || DEMO_SELLER_PROFILE.slug,
        title:       title || DEMO_SELLER_PROFILE.displayName,
        headline:    headline || null,
        bio:         bio || null,
        avatarUrl:   url,
        bannerUrl:   effectiveBannerUrl,
        featuredProductIds: storefront?.featuredProductIds ?? [],
        productOrder:       storefront?.productOrder ?? [],
        hiddenProductIds:   storefront?.hiddenProductIds ?? [],
        themeColor:   storefront?.themeColor ?? '#000000',
        buttonStyle:  storefront?.buttonStyle ?? 'rounded',
        cardStyle:    storefront?.cardStyle ?? 'soft_shadow',
        headerLayout: storefront?.headerLayout ?? 'left_avatar',
        cardDensity:  storefront?.cardDensity ?? 'comfortable',
        sectionOrder: storefront?.sectionOrder ?? [],
        sectionVisibility: storefront?.sectionVisibility ?? {},
        socialLinks: {
          twitter:   twitter   || undefined,
          instagram: instagram || undefined,
          youtube:   youtube   || undefined,
          website:   website   || undefined,
        },
        headerMedia:    storefront?.headerMedia ?? 'none',
        headerPhotoUrl: storefront?.headerPhotoUrl ?? null,
        headerVideoUrl: storefront?.headerVideoUrl ?? null,
        published:    true,
        brandingMode,
      })
      toast.success('Store photo updated.')
    } catch {
      toast.error('Store photo could not be saved. Click Save Profile to try again.')
    }
  }

  // ── Clipboard helper ────────────────────────────────────────
  function copyLink() {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true)
      toast.success('Link copied!')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // ── Save ────────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const effectiveBannerUrl = layoutMode === 'banner' && bannerUrl ? bannerUrl : null

    // 1. Persist to Supabase (if authenticated)
    if (!isDemo) {
      const err = await saveStore({
        name:        title,
        headline:    headline || null,
        bio:         bio || null,
        slug:        draftSlug,
        avatar_url:  avatarUrl,
        banner_url:  effectiveBannerUrl,
        layout_mode: layoutMode,
        branding_mode: brandingMode,
      })
      if (err) {
        toast.error(`Save failed: ${err}`)
        setSaving(false)
        return
      }
    }

    // Slug is now live — update savedSlug so public URLs reflect the new value
    setSavedSlug(draftSlug)

    // 2. Persist to localStorage (covers UI-only fields + demo fallback)
    await demoStorefrontRepo.upsert({
      sellerId:    DEMO_SELLER_PROFILE.id,
      slug:        draftSlug,
      title,
      headline:    headline || null,
      bio:         bio || null,
      avatarUrl:   avatarUrl ?? null,
      bannerUrl:   effectiveBannerUrl,
      featuredProductIds: storefront?.featuredProductIds ?? [],
      productOrder:       storefront?.productOrder ?? [],
      hiddenProductIds:   storefront?.hiddenProductIds ?? [],
      themeColor:   storefront?.themeColor ?? '#000000',
      buttonStyle:  storefront?.buttonStyle ?? 'rounded',
      cardStyle:    storefront?.cardStyle ?? 'soft_shadow',
      headerLayout: storefront?.headerLayout ?? 'left_avatar',
      cardDensity:  storefront?.cardDensity ?? 'comfortable',
      sectionOrder: storefront?.sectionOrder ?? [],
      sectionVisibility: storefront?.sectionVisibility ?? {},
      socialLinks: {
        twitter:   twitter   || undefined,
        instagram: instagram || undefined,
        youtube:   youtube   || undefined,
        website:   website   || undefined,
      },
      headerMedia:    storefront?.headerMedia ?? 'none',
      headerPhotoUrl: storefront?.headerPhotoUrl ?? null,
      headerVideoUrl: storefront?.headerVideoUrl ?? null,
      published:    true,
      brandingMode,
    })

    // 3. Best-effort Supabase banner sync via legacy API route
    fetch('/api/v5/store-banner', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bannerUrl: effectiveBannerUrl, layoutMode }),
    }).catch(() => { /* best-effort */ })

    toast.success('Store profile saved.')
    setSaving(false)
  }

  // ── Loading skeleton ────────────────────────────────────────
  if (storeLoading) {
    return (
      <div className="max-w-2xl flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-black">Store Profile</h1>
        <p className="text-neutral-500 text-sm mt-1">Manage your public store identity.</p>
        {isDemo && (
          <p className="text-xs text-amber-600 mt-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Demo mode — connect Supabase to save your real store.
          </p>
        )}
      </div>

      {/* Store identity preview */}
      <StoreIdentityCard className="mb-5" showEditorLink={false} />

      {/* Public URL + copy/open — always shows savedSlug */}
      <div className="mb-6 bg-white border border-neutral-200 rounded-xl px-4 py-3 space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-0.5">Public URL</p>
            <p className="text-sm text-neutral-800 font-mono truncate">/store/{effectiveSavedSlug}</p>
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
        {hasUnsavedLink && (
          <p className="text-xs text-amber-600">
            Unsaved store link changes — save profile to make this URL live.
          </p>
        )}
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
              <div className="flex-1 min-w-0">
                <AiImagePicker
                  value={avatarUrl}
                  onChange={url => void handleStoreAvatarChange(url)}
                  imageType="store_avatar"
                  bucket="store-images"
                  ownerId={uploadOwnerId}
                  aspectClass="aspect-square"
                  hint="Square image recommended, 400×400px or larger."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Store Layout / Banner ──────────────────────────── */}
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
              <AiImagePicker
                value={bannerUrl}
                onChange={url => setBannerUrl(url)}
                imageType="store_banner"
                bucket="store-banners"
                ownerId={uploadOwnerId}
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
                { value: 'minimal',     label: 'Minimal',             desc: 'Make your store feel like your own site — no SellBop header or badge.' },
                { value: 'powered_by',  label: 'Powered by SellBop',  desc: 'Show a small "Powered by SellBop" badge in the footer only.' },
                { value: 'full_header', label: 'Full SellBop header', desc: 'Show the SellBop navigation bar at the top of your store.' },
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
              placeholder="Your Store Name"
              hint="Shown as your public store name."
            />
            <LinkField
              label="Store link"
              value={draftSlug}
              onChange={setDraftSlug}
              prefix="sellbop.com/store/"
              checkUrl="/api/availability/store-link"
              ownerParam={storeLinkOwnerParam}
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
