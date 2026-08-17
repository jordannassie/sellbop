'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useAuth } from '@/context/auth-context'
import { useUserStore } from '@/hooks/use-user-store'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { uploadFile, buildStoragePath } from '@/lib/supabase/storage'
import { Upload, User, Loader2, ExternalLink, X } from 'lucide-react'
import { SOCIAL_PLATFORMS, SocialIcon, normalizeSocialUrl } from '@/components/ui/social-icons'
import {
  isCustomStoreBanner,
  resolveStoreBannerUrl,
} from '@/lib/store-defaults'

export default function SettingsPage() {
  const router = useRouter()
  const { session, signOut, updateAvatarUrl } = useAuth()
  const { store, saveStore, refetch } = useUserStore()

  // Profile form
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [supportEmail, setSupportEmail] = useState('')
  const [storeName, setStoreName] = useState('')
  const [storeSlug, setStoreSlug] = useState('')
  const [saving, setSaving] = useState(false)

  // Avatar
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    setDisplayName(session?.name ?? '')
    setSupportEmail(session?.email ?? '')
    if (session?.avatarUrl) setProfileAvatar(session.avatarUrl)
  }, [session])

  useEffect(() => {
    if (store) {
      setStoreName(store.name ?? '')
      setStoreSlug(store.slug ?? '')
      setBio(store.bio ?? '')
      setSupportEmail(store.support_email ?? session?.email ?? '')
      if (store.avatar_url) setProfileAvatar(store.avatar_url)
      setBannerUrl(store.banner_url ?? null)
      if (store.social_links) setSocialLinks(store.social_links as Record<string, string>)
    }
  }, [store, session?.email])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !session) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB.'); return }
    setUploadingPhoto(true)
    const path = buildStoragePath(session.userId, file.name)
    const result = await uploadFile('store-images', path, file)
    if (result.error) { toast.error('Upload failed: ' + result.error) }
    else if (result.url) {
      setProfileAvatar(result.url)
      updateAvatarUrl(result.url)
      // Save to store
      await saveStore({ avatar_url: result.url })
      // Save to profile
      const supabase = getSupabaseBrowserClient()
      if (supabase) {
        await supabase.from('profiles').upsert({
          user_id: session.userId,
          email: session.email,
          avatar_url: result.url,
        })
        // Also persist into the auth user's own metadata. The sidebar/menu
        // avatar is derived from session data, and the session gets rebuilt
        // from this metadata on every auth refresh (tab focus, token
        // refresh, etc). Without this, those rebuilds fall back to the old/
        // missing avatar_url and the sidebar reverts to the old photo a few
        // seconds after upload.
        await supabase.auth.updateUser({ data: { avatar_url: result.url } })
      }
      // Force any independently-fetched store state (e.g. the sidebar's own
      // useUserStore instance, or server-rendered pages) to pick up the
      // change immediately rather than waiting for their next natural fetch.
      refetch()
      router.refresh()
      toast.success('Profile photo updated.')
    }
    setUploadingPhoto(false)
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !session) return
    if (file.size > 10 * 1024 * 1024) { toast.error('Banner must be under 10 MB.'); return }

    // Guard against blob: or data: URLs slipping through (shouldn't happen with real Supabase)
    setUploadingBanner(true)
    const path = buildStoragePath(session.userId, `banner-${file.name}`)
    const result = await uploadFile('store-banners', path, file)

    if (result.error) {
      toast.error('Upload failed: ' + result.error)
    } else if (result.url) {
      // Reject browser-local blob/data URLs — they are not durable
      if (result.url.startsWith('blob:') || result.url.startsWith('data:')) {
        toast.error('Upload did not return a real storage URL. Check Supabase configuration.')
      } else {
        setBannerUrl(result.url)
        const err = await saveStore({ banner_url: result.url })
        if (err) {
          toast.error('Banner uploaded but could not save to store: ' + err)
        } else {
          toast.success('Banner updated.')
          // Refresh store state and bust any server-side page cache
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
      // Normalize and filter empty entries
      const normalized: Record<string, string> = {}
      for (const [k, v] of Object.entries(socialLinks)) {
        const url = normalizeSocialUrl(v)
        if (url) normalized[k] = url
      }
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

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!session) return
    setSaving(true)
    try {
      const supabase = getSupabaseBrowserClient()
      if (supabase) {
        await supabase.from('profiles').upsert({
          user_id: session.userId,
          email: session.email,
          full_name: displayName.trim() || null,
          avatar_url: profileAvatar,
        })
      }

      const storeErr = await saveStore({
        name: storeName.trim() || displayName.trim(),
        bio: bio.trim() || null,
        support_email: supportEmail.trim() || session.email,
        // Always re-affirm banner_url so clicking Save Store never accidentally
        // clears a banner that was set independently by handleBannerUpload.
        banner_url: bannerUrl,
      })
      if (storeErr) throw new Error(storeErr)
      refetch()
      router.refresh()
      toast.success('Profile saved.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setSaving(false)
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

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage your profile, store, and account.</p>
      </div>

      <div className="space-y-5">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-neutral-100 overflow-hidden flex items-center justify-center">
                  {profileAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profileAvatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={22} className="text-neutral-400" />
                  )}
                </div>
              </div>
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
                <p className="text-xs text-neutral-400 mt-1">JPG, PNG · Max 5 MB</p>
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Input
                label="Display Name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
              <Input
                label="Bio"
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="A short description about you"
              />
              <Input
                label="Support Email"
                type="email"
                value={supportEmail}
                onChange={e => setSupportEmail(e.target.value)}
                placeholder="support@yourstore.com"
              />
              <Button type="submit" loading={saving}>Save Profile</Button>
            </form>
          </CardContent>
        </Card>

        {/* Store */}
        <Card>
          <CardHeader>
            <CardTitle>Store</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Banner image */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-2">Store Banner</label>
              <div
                className="relative w-full rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 mb-2"
                style={{ aspectRatio: '4/1' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={displayBannerUrl} alt="Store banner" className="w-full h-full object-cover" />
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

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Input
                label="Store Name"
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                placeholder="My Awesome Store"
              />
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Store URL</label>
                <div className="flex items-center rounded-xl border border-neutral-200 overflow-hidden">
                  <span className="px-3 py-2.5 text-sm text-neutral-500 bg-neutral-50 border-r border-neutral-200 shrink-0">
                    sellbop.com/
                  </span>
                  <span className="px-3 py-2.5 text-sm font-mono text-neutral-700">{storeSlug || '—'}</span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">Your store URL. Slug is set during setup.</p>
              </div>
              {storeUrl && (
                <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-black transition-colors">
                  View your store <ExternalLink size={13} />
                </a>
              )}
              <Button type="submit" loading={saving}>Save Store</Button>
            </form>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-neutral-400 mb-4">Add links to your social profiles. Only platforms you fill in will appear on your storefront.</p>
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
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Email</label>
              <p className="text-sm text-neutral-700">{session?.email}</p>
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
              Let Claude and other AI tools create and manage products in your store.
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
