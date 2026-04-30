'use client'
import { useState } from 'react'
import Link from 'next/link'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  ArrowUpRight,
  CreditCard,
  HelpCircle,
  Plug,
  Settings,
  Store,
  User,
} from 'lucide-react'

const SETTING_CARDS = [
  {
    title: 'Account',
    description: 'Name, email, and support settings.',
    href: '#account',
    icon: User,
  },
  {
    title: 'Billing',
    description: 'Platform plan, invoices, and payment method.',
    href: '/dashboard/billing',
    icon: CreditCard,
  },
  {
    title: 'Integrations',
    description: 'Printify, Stripe, and connected apps.',
    href: '/dashboard/printify',
    icon: Plug,
  },
  {
    title: 'Store Settings',
    description: 'Domain, notifications, and store preferences.',
    href: '/dashboard/storefront',
    icon: Store,
  },
  {
    title: 'Support',
    description: 'Get help or contact the SellBop team.',
    href: 'mailto:support@sellbop.com',
    icon: HelpCircle,
    external: true,
  },
]

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState(DEMO_SELLER_PROFILE.displayName)
  const [supportEmail, setSupportEmail] = useState(DEMO_SELLER_PROFILE.supportEmail)
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
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Settings size={18} className="text-neutral-400" />
          <h1 className="text-2xl font-bold text-black">Settings</h1>
        </div>
        <p className="text-sm text-neutral-500">Manage your account and business preferences.</p>
      </div>

      {/* Quick nav cards */}
      <div className="grid grid-cols-2 gap-3 mb-8 sm:grid-cols-3">
        {SETTING_CARDS.map(card => {
          const inner = (
            <div className="group rounded-xl border border-neutral-200 bg-white p-4 hover:border-neutral-300 hover:shadow-sm transition-all">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100">
                  <card.icon size={15} className="text-neutral-600" />
                </div>
                <ArrowUpRight size={12} className="text-neutral-300 group-hover:text-neutral-500 transition-colors" />
              </div>
              <p className="text-sm font-semibold text-black">{card.title}</p>
              <p className="mt-0.5 text-[11px] text-neutral-500 leading-relaxed">{card.description}</p>
            </div>
          )

          if (card.external) {
            return (
              <a key={card.title} href={card.href}>
                {inner}
              </a>
            )
          }
          if (card.href.startsWith('#')) {
            return (
              <a key={card.title} href={card.href}>
                {inner}
              </a>
            )
          }
          return (
            <Link key={card.title} href={card.href}>
              {inner}
            </Link>
          )
        })}
      </div>

      {/* Account form */}
      <form id="account" onSubmit={handleSave} className="space-y-5">
        <Card>
          <CardHeader><CardTitle>Account</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Account Name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              hint="Your personal account name — not shown publicly."
            />
            <Input
              label="Support Email"
              type="email"
              value={supportEmail}
              onChange={e => setSupportEmail(e.target.value)}
              hint="Shown on product pages and receipts sent to buyers."
            />
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
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => alert('Demo: Account deletion would require confirmation.')}
              >
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" loading={saving}>Save Settings</Button>
      </form>
    </div>
  )
}
