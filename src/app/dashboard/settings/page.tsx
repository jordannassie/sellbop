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
import { Upload, User, Loader2, ExternalLink } from 'lucide-react'

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
      }
      toast.success('Profile photo updated.')
    }
    setUploadingPhoto(false)
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
      })
      if (storeErr) throw new Error(storeErr)
      refetch()
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

  const storeUrl = store?.slug ? `/store/${store.slug}` : null

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
          <CardContent>
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
                    sellbop.com/store/
                  </span>
                  <span className="px-3 py-2.5 text-sm font-mono text-neutral-700">{storeSlug || '—'}</span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">Store slug is set automatically and cannot be changed here yet.</p>
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
