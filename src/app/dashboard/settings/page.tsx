'use client'
import { useState } from 'react'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState(DEMO_SELLER_PROFILE.displayName)
  const [brandName, setBrandName] = useState(DEMO_SELLER_PROFILE.brandName ?? '')
  const [supportEmail, setSupportEmail] = useState(DEMO_SELLER_PROFILE.supportEmail)
  const [bio, setBio] = useState(DEMO_SELLER_PROFILE.bio ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    toast.success('Settings saved.')
    setSaving(false)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-black">Settings</h1>
        <p className="text-neutral-500 text-sm mt-1">Manage your seller profile and preferences.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Display Name" value={displayName} onChange={e => setDisplayName(e.target.value)} />
              <Input label="Brand Name" value={brandName} onChange={e => setBrandName(e.target.value)} />
            </div>
            <Input label="Support Email" type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} hint="Shown on sell pages and receipts." />
            <Textarea label="Bio" value={bio} onChange={e => setBio(e.target.value)} rows={3} hint="Shown on your public storefront." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Checkout Settings</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-neutral-900">Collect buyer name</p>
                <p className="text-xs text-neutral-500">Ask for full name at checkout.</p>
              </div>
              <div className="w-9 h-5 bg-black rounded-full flex items-center justify-end px-0.5">
                <div className="w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between py-1 border-t border-neutral-100">
              <div>
                <p className="text-sm font-medium text-neutral-900">Send receipt emails</p>
                <p className="text-xs text-neutral-500">Automatically email buyers after purchase.</p>
              </div>
              <div className="w-9 h-5 bg-black rounded-full flex items-center justify-end px-0.5">
                <div className="w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Danger Zone</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-900">Delete Account</p>
                <p className="text-xs text-neutral-500">Permanently delete your account and all data.</p>
              </div>
              <Button type="button" variant="danger" size="sm" onClick={() => alert('Demo: Account deletion would require confirmation.')}>Delete Account</Button>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" loading={saving}>Save Settings</Button>
      </form>
    </div>
  )
}
