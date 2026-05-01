'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useAuth } from '@/context/auth-context'
import { useDemoMode } from '@/hooks/use-demo-mode'
import {
  ArrowUpRight,
  CreditCard,
  FlaskConical,
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
  const { session } = useAuth()
  const { demoMode, ready, toggle } = useDemoMode()

  // Pre-fill Account form from the real auth session
  const [displayName, setDisplayName] = useState('')
  const [supportEmail, setSupportEmail] = useState('')
  const [saving, setSaving] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setDisplayName(session?.name ?? '')
    setSupportEmail(session?.email ?? '')
  }, [session])
  /* eslint-enable react-hooks/set-state-in-effect */

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

          if (card.external || card.href.startsWith('#')) {
            return <a key={card.title} href={card.href}>{inner}</a>
          }
          return <Link key={card.title} href={card.href}>{inner}</Link>
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
              placeholder={session?.name ?? 'Your name'}
            />
            <Input
              label="Support Email"
              type="email"
              value={supportEmail}
              onChange={e => setSupportEmail(e.target.value)}
              hint="Shown on product pages and receipts sent to buyers."
              placeholder={session?.email ?? 'you@example.com'}
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

        {/* ── Developer / Demo Mode ──────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical size={15} className="text-neutral-500" />
              Developer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-medium text-neutral-900">Use demo data</p>
                <p className="text-xs text-neutral-500 leading-relaxed mt-0.5">
                  Turns on sample products, orders, customers, and store data for testing.
                  Turn off to see your real store with clean empty states.
                </p>
              </div>
              {/* Toggle button — only interactive once localStorage is read */}
              <button
                type="button"
                disabled={!ready}
                onClick={() => toggle(!demoMode)}
                aria-label="Toggle demo data"
                className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                  demoMode ? 'bg-black' : 'bg-neutral-200'
                } ${!ready ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                    demoMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed">
              You can also toggle via URL:{' '}
              <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded">?demo=1</code>
              {' '}to enable,{' '}
              <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded">?demo=0</code>
              {' '}to disable.
            </p>
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
                onClick={() => toast.error('Account deletion is not available in beta.')}
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
