'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DEMO_USERS, DEMO_PRODUCTS, DEMO_ORDERS, DEMO_CUSTOMERS, DEMO_COUPONS } from '@/lib/demo-data/seed'
import { toast } from 'sonner'
import { demoAuth } from '@/lib/adapters/demo/auth'

const STORAGE_KEYS = ['selli_demo_products', 'selli_demo_orders', 'selli_demo_customers', 'selli_demo_coupons', 'selli_demo_file_assets', 'selli_demo_download_grants', 'selli_demo_subscriptions', 'selli_demo_analytics', 'selli_demo_email_logs', 'selli_demo_payouts', 'selli_demo_storefronts', 'selli_demo_session']

export default function DemoCenterPage() {
  const [log, setLog] = useState<string[]>([])

  function addLog(msg: string) {
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)])
  }

  function resetAllData() {
    STORAGE_KEYS.forEach(k => localStorage.removeItem(k))
    toast.success('All demo data reset to seed defaults.')
    addLog('Reset all localStorage data to seed defaults.')
  }

  async function switchToCreator() {
    await demoAuth.signIn('creator@selli.demo', 'demo123')
    toast.success('Switched to creator account.')
    addLog('Switched active session → creator@selli.demo')
    window.location.href = '/dashboard'
  }

  async function switchToBuyer() {
    await demoAuth.signIn('buyer@selli.demo', 'demo123')
    toast.success('Switched to buyer account.')
    addLog('Switched active session → buyer@selli.demo')
  }

  async function triggerFakePurchase() {
    const { completeCheckout, createCheckoutSession } = await import('@/lib/services/checkout')
    const product = DEMO_PRODUCTS[Math.floor(Math.random() * DEMO_PRODUCTS.length)]
    const session = await createCheckoutSession(product.id)
    if (!session) return
    const order = await completeCheckout(session, `test${Date.now()}@buyer.demo`, 'Test Buyer')
    toast.success(`Fake purchase: ${product.name}`)
    addLog(`Fake purchase triggered: ${product.name} → Order ${order.id}`)
  }

  function inspectRepo(key: string) {
    const raw = localStorage.getItem(`selli_demo_${key}`)
    const data = raw ? JSON.parse(raw) : 'using seed defaults'
    console.info(`[demo-center] ${key}:`, data)
    toast.info(`${key} inspected — check browser console.`)
    addLog(`Inspected repository: ${key}`)
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold">Selli Demo Center</h1>
              <Badge variant="warning">Internal</Badge>
            </div>
            <p className="text-sm text-neutral-500">Developer tools for testing and demo management. Not visible to real users.</p>
          </div>
          <Link href="/dashboard" className="text-xs text-neutral-500 hover:text-white">← Back to Dashboard</Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Products', count: DEMO_PRODUCTS.length },
            { label: 'Orders', count: DEMO_ORDERS.length },
            { label: 'Customers', count: DEMO_CUSTOMERS.length },
            { label: 'Coupons', count: DEMO_COUPONS.length },
            { label: 'Users', count: DEMO_USERS.length },
          ].map(s => (
            <div key={s.label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <p className="text-xs text-neutral-500 mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-white">{s.count}</p>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mb-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold mb-4">Account Switcher</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-neutral-800">
                <div>
                  <p className="text-sm text-neutral-200">Creator Account</p>
                  <p className="text-xs text-neutral-500">creator@selli.demo</p>
                </div>
                <Button size="xs" onClick={switchToCreator}>Switch →</Button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-neutral-200">Buyer Account</p>
                  <p className="text-xs text-neutral-500">buyer@selli.demo</p>
                </div>
                <Button size="xs" variant="secondary" onClick={switchToBuyer}>Switch →</Button>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold mb-4">Actions</h2>
            <div className="space-y-2">
              <Button size="sm" className="w-full bg-neutral-700 hover:bg-neutral-600 text-white" onClick={triggerFakePurchase}>
                Trigger Fake Purchase
              </Button>
              <Button size="sm" variant="danger" className="w-full" onClick={resetAllData}>
                Reset All Demo Data
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 mb-5">
          <h2 className="text-sm font-semibold mb-4">Repository Inspector</h2>
          <p className="text-xs text-neutral-500 mb-3">Click to log repository state to browser console.</p>
          <div className="flex flex-wrap gap-2">
            {['products', 'orders', 'customers', 'coupons', 'file_assets', 'download_grants', 'subscriptions', 'analytics', 'email_logs', 'payouts', 'storefronts'].map(key => (
              <button key={key} onClick={() => inspectRepo(key)} className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2.5 py-1.5 rounded-md font-mono transition-colors">
                {key}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 mb-5">
          <h2 className="text-sm font-semibold mb-4">Quick Links</h2>
          <div className="flex flex-wrap gap-2">
            {[
              ['/dashboard', 'Dashboard'],
              ['/p/notion-template-pack', 'Sell Page'],
              ['/store/alexjohnson', 'Storefront'],
              ['/checkout/product-1', 'Checkout'],
              ['/demo', 'Demo Page'],
              ['/pricing', 'Pricing'],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2.5 py-1.5 rounded-md transition-colors">{label}</Link>
            ))}
          </div>
        </div>

        {/* Event log */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-3">Event Log</h2>
          {log.length === 0 ? (
            <p className="text-xs text-neutral-600 font-mono">No events yet. Try an action above.</p>
          ) : (
            <div className="space-y-1">
              {log.map((entry, i) => (
                <p key={i} className="text-xs text-neutral-400 font-mono">{entry}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
