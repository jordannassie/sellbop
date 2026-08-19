'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Toggle } from '@/components/ui/toggle'
import { PartnerBadgeIcon } from '@/components/ui/partner-badge-icon'
import { AvatarWithPartnerBadge } from '@/components/ui/avatar-with-partner-badge'
import { toast } from 'sonner'
import { useAuth } from '@/context/auth-context'
import { useUserStore } from '@/hooks/use-user-store'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { uploadFile, buildStoragePath } from '@/lib/supabase/storage'
import { Upload, Store, Loader2, ExternalLink, X } from 'lucide-react'
import { SOCIAL_PLATFORMS, SocialIcon, normalizeSocialUrl } from '@/components/ui/social-icons'
import {
  isCustomStoreBanner,
  resolveStoreBannerUrl,
  STORE_BANNER_BG_CLASS,
} from '@/lib/store-defaults'
import { PARTNER_SOCIAL_IS_KEY, PARTNER_SOCIAL_SHOW_KEY, partnerFromSocialLinks, stripPartnerSocialLinks } from '@/lib/partner-storage'

export default function SettingsPage() {
  const router = useRouter()
  const { session, signOut } = useAuth()
  const { store, saveStore, refetch, activeStoreId } = useUserStore()

  // Shop profile form (active shop only)
  const [storeName, setStoreName] = useState('')
  const [storeSlug, setStoreSlug] = useState('')
  const [bio, setBio] = useState('')
  const [supportEmail, setSupportEmail] = useState('')
  const [savingShop, setSavingShop] = useState(false)

  // Shop avatar (stores.avatar_url — independent from account)
  const [shopAvatar, setShopAvatar] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  // Account identity (read-only display)
  const [accountName, setAccountName] = useState('')

  // Banner
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  // Social links
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({})
  const [savingSocial, setSavingSocial] = useState(false)

  // Password
  const [newPassword, setNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  // Danger
  const [deletingAccount, setDeletingAccount] = useState(false)

  // Partner badge
  const [isPartner, setIsPartner] = useState(false)
  const [showPartnerBadge, setShowPartnerBadge] = useState(true)
  const [loadingPartnerSettings, setLoadingPartnerSettings] = useState(true)
  const [savingPartnerBadge, setSavingPartnerBadge] = useState(false)

  const storePartnerStatus = partnerFromSocialLinks(
    (store?.social_links as Record<string, string> | null) ?? null,
  )
  const badgeIsPartner = loadingPartnerSettings ? storePartnerStatus.isPartner : isPartner
  const badgeShowPartner = loadingPartnerSettings ? storePartnerStatus.showPartnerBadge : showPartnerBadge

  // Account identity — from auth session + profiles table
  useEffect(() => {
    if (!session) return
    setAccountName(session.name ?? '')

    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    void supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', session.userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.full_name) setAccountName(data.full_name)
      })
  }, [session])

  // Shop identity — reload when active shop changes
  useEffect(() => {
    if (!store) return
    setStoreName(store.name ?? '')
    setStoreSlug(store.slug ?? '')
    setBio(store.bio ?? '')
    setSupportEmail(store.support_email ?? '')
    setShopAvatar(store.avatar_url ?? null)
    setBannerUrl(store.banner_url ?? null)
    if (store.social_links) {
      setSocialLinks(stripPartnerSocialLinks(store.social_links as Record<string, string>))
    } else {
      setSocialLinks({})
    }
  }, [store?.id, activeStoreId])

  useEffect(() => {
    fetch('/api/profile/partner-badge')
      .then(r => r.ok ? r.json() : null)
      .then((data: { isPartner?: boolean; showPartnerBadge?: boolean } | null) => {
        if (data) {
          setIsPartner(Boolean(data.isPartner))
          setShowPartnerBadge(data.showPartnerBadge !== false)
        }
      })
      .catch(() => { /* non-partner or unavailable */ })
      .finally(() => setLoadingPartnerSettings(false))
  }, [])

  async function handlePartnerBadgeToggle(next: boolean) {
    setSavingPartnerBadge(true)
    try {
      const res = await fetch('/api/profile/partner-badge', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showPartnerBadge: next }),
      })
      const data = await res.json() as { showPartnerBadge?: boolean; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to update partner badge.')
      setShowPartnerBadge(data.showPartnerBadge !== false)
      toast.success(next ? 'Partner badge enabled.' : 'Partner badge hidden.')
      refetch()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update partner badge.')
    } finally {
      setSavingPartnerBadge(false)
    }
  }

  async function handleShopAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !session) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB.'); return }
    setUploadingPhoto(true)
    const path = buildStoragePath(session.userId, `shop-${store?.id ?? 'avatar'}-${file.name}`)
    const result = await uploadFile('store-images', path, file)
    if (result.error) {
      toast.error('Upload failed: ' + result.error)
    } else if (result.url) {
      setShopAvatar(result.url)
      const err = await saveStore({ avatar_url: result.url })
      if (err) {
        toast.error('Photo uploaded but could not save to shop: ' + err)
      } else {
        refetch()
        router.refresh()
        toast.success('Shop photo updated.')
      }
    }
    setUploadingPhoto(false)
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !session) return
    if (file.size > 10 * 1024 * 1024) { toast.error('Banner must be under 10 MB.'); return }

    setUploadingBanner(true)
    const path = buildStoragePath(session.userId, `banner-${file.name}`)
    const result = await uploadFile('store-banners', path, file)

    if (result.error) {
      toast.error('Upload failed: ' + result.error)
    } else if (result.url) {
      if (result.url.startsWith('blob:') || result.url.startsWith('data:')) {
        toast.error('Upload did not return a real storage URL. Check Supabase configuration.')
      } else {
        setBannerUrl(result.url)
        const err = await saveStore({ banner_url: result.url })
        if (err) {
          toast.error('Banner uploaded but could not save to shop: ' + err)
        } else {
          toast.success('Banner updated.')
          refetch()
          router.refresh()
        }
      }
    }

    setUploadingBanner(false)
    if (bannerInputRef.current) bannerInputRef.current.value = ''
  }

  async function handleUseDefaultBanner() {
    setBannerUrl(null)
    const err = await saveStore({ banner_url: null })
    if (err) {
      toast.error('Could not reset banner: ' + err)
    } else {
      toast.success('Default banner restored.')
      refetch()
      router.refresh()
    }
  }

  async function handleRemoveBanner() {
    await handleUseDefaultBanner()
  }

  function setSocialLink(key: string, value: string) {
    setSocialLinks(prev => ({ ...prev, [key]: value }))
  }

  async function handleSaveSocial(e: React.FormEvent) {
    e.preventDefault()
    setSavingSocial(true)
    try {
      const normalized: Record<string, string> = {}
      for (const [k, v] of Object.entries(socialLinks)) {
        const url = normalizeSocialUrl(v)
        if (url) normalized[k] = url
      }
      const existing = (store?.social_links as Record<string, string> | null) ?? {}
      if (existing[PARTNER_SOCIAL_IS_KEY]) normalized[PARTNER_SOCIAL_IS_KEY] = existing[PARTNER_SOCIAL_IS_KEY]
      if (existing[PARTNER_SOCIAL_SHOW_KEY]) normalized[PARTNER_SOCIAL_SHOW_KEY] = existing[PARTNER_SOCIAL_SHOW_KEY]
      const err = await saveStore({ social_links: normalized })
      if (err) throw new Error(err)
      setSocialLinks(normalized)
      toast.success('Social links saved.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setSavingSocial(false)
    }
  }

  async function handleSaveShopProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!session || !store) return
    setSavingShop(true)
    try {
      const storeErr = await saveStore({
        name: storeName.trim(),
        bio: bio.trim() || null,
        support_email: supportEmail.trim() || null,
        banner_url: bannerUrl,
      })
      if (storeErr) throw new Error(storeErr)
      refetch()
      router.refresh()
      toast.success('Shop profile saved.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setSavingShop(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    setSavingPassword(true)
    const supabase = getSupabaseBrowserClient()
    if (!supabase) { toast.error('Not connected.'); setSavingPassword(false); return }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { toast.error(error.message) }
    else { toast.success('Password updated.'); setNewPassword('') }
    setSavingPassword(false)
  }

  async function handleDeleteAccount() {
    if (!confirm('Are you sure? This will permanently delete your account, products, and all data. This cannot be undone.')) return
    setDeletingAccount(true)
    toast.error('Account deletion requires contacting support@sellbop.com for now.')
    setDeletingAccount(false)
  }

  async function handleLogout() {
    await signOut()
    router.push('/')
  }

  const storeUrl = store?.slug ? `/${store.slug}` : null
  const displayBannerUrl = resolveStoreBannerUrl(bannerUrl)
  const usingCustomBanner = isCustomStoreBanner(bannerUrl)
  const shopInitial = (storeName.charAt(0) || 'S').toUpperCase()

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage your Shop and SellBop account.</p>
      </div>

      <div className="space-y-5">
        {/* Shop Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Shop Profile</CardTitle>
            <p className="text-sm text-neutral-500 mt-1">Manage how this Shop appears to customers.</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <AvatarWithPartnerBadge
                isPartner={badgeIsPartner}
                showPartnerBadge={badgeShowPartner}
              >
                <div className="w-16 h-16 rounded-full bg-neutral-100 overflow-hidden flex items-center justify-center">
                  {shopAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shopAvatar} alt={storeName || 'Shop'} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-neutral-500">{shopInitial}</span>
                  )}
                </div>
              </AvatarWithPartnerBadge>
              <div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  {uploadingPhoto ? 'Uploading…' : 'Change photo'}
                </Button>
                <p className="text-xs text-neutral-400 mt-1">Shop photo · JPG, PNG · Max 5 MB</p>
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleShopAvatarUpload}
              />
            </div>

            <form onSubmit={handleSaveShopProfile} className="space-y-4">
              <Input
                label="Shop Name"
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                placeholder="Jessica Fitness"
              />
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Shop URL</label>
                <div className="flex items-center rounded-xl border border-neutral-200 overflow-hidden">
                  <span className="px-3 py-2.5 text-sm text-neutral-500 bg-neutral-50 border-r border-neutral-200 shrink-0">
                    sellbop.com/
                  </span>
                  <span className="px-3 py-2.5 text-sm font-mono text-neutral-700">{storeSlug || '—'}</span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">Your shop URL is set when the Shop is created.</p>
              </div>
              {storeUrl && (
                <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-black transition-colors">
                  View your shop <ExternalLink size={13} />
                </a>
              )}
              <Input
                label="Shop Bio"
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="A short description about this shop"
              />
              <Input
                label="Support Email"
                type="email"
                value={supportEmail}
                onChange={e => setSupportEmail(e.target.value)}
                placeholder="support@yourshop.com"
              />
              <p className="text-xs text-neutral-400 -mt-2">
                Customers use this email to contact this Shop. It does not change your SellBop login email.
              </p>
              <Button type="submit" loading={savingShop}>Save Shop Profile</Button>
            </form>
          </CardContent>
        </Card>

        {(badgeIsPartner || isPartner) && !loadingPartnerSettings && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PartnerBadgeIcon size={18} />
                Partner Badge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Toggle
                    checked={showPartnerBadge}
                    onChange={handlePartnerBadgeToggle}
                    label="Show Partner Badge"
                    disabled={savingPartnerBadge}
                  />
                  <p className="mt-2 text-xs text-neutral-500">
                    Display your SellBop Partner badge on your public shop profile.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shop Banner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store size={16} />
              Shop Banner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-2">Banner Image</label>
              <div
                className={`relative w-full rounded-xl overflow-hidden border border-neutral-200 mb-2 ${STORE_BANNER_BG_CLASS}`}
                style={{ aspectRatio: '4/1' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={displayBannerUrl} alt="Shop banner" className="w-full h-full object-cover" />
                {usingCustomBanner && (
                  <button
                    onClick={handleRemoveBanner}
                    className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    aria-label="Remove custom banner"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadingBanner}
                >
                  {uploadingBanner ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  {uploadingBanner ? 'Uploading…' : usingCustomBanner ? 'Change Banner' : 'Upload Custom Banner'}
                </Button>
                {usingCustomBanner && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleUseDefaultBanner}
                    disabled={uploadingBanner}
                  >
                    Use default banner
                  </Button>
                )}
                <p className="text-xs text-neutral-400">1920 × 600 recommended · JPG, PNG · Max 10 MB</p>
              </div>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerUpload}
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-neutral-400 mb-4">Add links to this Shop&apos;s social profiles. Only platforms you fill in will appear on your storefront.</p>
            <form onSubmit={handleSaveSocial} className="space-y-3">
              {SOCIAL_PLATFORMS.map(platform => (
                <div key={platform.key} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-32 flex-shrink-0">
                    <span className="text-neutral-500 flex-shrink-0">
                      <SocialIcon platform={platform.key} size={14} />
                    </span>
                    <span className="text-xs font-medium text-neutral-600 truncate">{platform.label}</span>
                  </div>
                  <input
                    type="text"
                    inputMode="url"
                    value={socialLinks[platform.key] ?? ''}
                    onChange={e => setSocialLink(platform.key, e.target.value)}
                    placeholder={platform.placeholder}
                    className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black placeholder:text-neutral-300"
                  />
                </div>
              ))}
              <div className="pt-2">
                <Button type="submit" loading={savingSocial}>Save Social Links</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <p className="text-sm text-neutral-500 mt-1">Your SellBop login and account information.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Account Name</label>
              <p className="text-sm text-neutral-700">{accountName || session?.email?.split('@')[0] || '—'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Login Email</label>
              <p className="text-sm text-neutral-700">{session?.email}</p>
              <p className="text-xs text-neutral-400 mt-1">This is the email you use to sign into SellBop.</p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3 pt-2 border-t border-neutral-100">
              <p className="text-sm font-medium text-neutral-700">Change Password</p>
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password (min 8 chars)"
              />
              <Button type="submit" size="sm" variant="secondary" loading={savingPassword}>
                Update Password
              </Button>
            </form>

            <div className="pt-2 border-t border-neutral-100">
              <Button variant="ghost" onClick={handleLogout} className="text-neutral-600">
                Log out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI & Integrations */}
        <Card>
          <CardHeader>
            <CardTitle>AI & Integrations</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm text-neutral-600">
              Let Claude and other AI tools create and manage products in your shop.
            </p>
            <Button size="sm" variant="secondary" onClick={() => router.push('/dashboard/settings/ai-integrations')}>
              Manage
            </Button>
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-600 mb-4">
              Permanently delete your account, products, and all associated data.
              This action cannot be undone.
            </p>
            <Button
              variant="ghost"
              onClick={handleDeleteAccount}
              loading={deletingAccount}
              className="text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
