'use client'
import { useState, useEffect } from 'react'
import { demoCouponRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { Tag } from 'lucide-react'
import { toast } from 'sonner'
import type { Coupon } from '@/lib/domain/entities'

export default function DiscountsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [showForm, setShowForm] = useState(false)
  const [code, setCode] = useState('')
  const [type, setType] = useState<'percent' | 'fixed'>('percent')
  const [value, setValue] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { demoCouponRepo.findBySellerId(DEMO_SELLER_PROFILE.id).then(setCoupons) }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!code || !value) return
    setSaving(true)
    const c = await demoCouponRepo.create({
      sellerId: DEMO_SELLER_PROFILE.id, code: code.toUpperCase(),
      type, value: type === 'fixed' ? Math.round(parseFloat(value) * 100) : parseFloat(value),
      maxUses: maxUses ? parseInt(maxUses) : null, usedCount: 0,
      active: true, expiresAt: null, productIds: null,
    })
    setCoupons(prev => [...prev, c])
    setShowForm(false); setCode(''); setValue(''); setMaxUses('')
    toast.success(`Coupon ${c.code} created.`)
    setSaving(false)
  }

  async function toggleActive(coupon: Coupon) {
    await demoCouponRepo.update(coupon.id, { active: !coupon.active })
    setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, active: !c.active } : c))
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Discounts</h1>
          <p className="text-neutral-500 text-sm mt-1">{coupons.filter(c => c.active).length} active coupons</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>+ New Coupon</Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Create Coupon</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid sm:grid-cols-4 gap-4">
              <Input label="Code" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="WELCOME10" required />
              <Select label="Type" value={type} onChange={e => setType(e.target.value as 'percent' | 'fixed')} options={[{ value: 'percent', label: 'Percent %' }, { value: 'fixed', label: 'Fixed $' }]} />
              <Input label={type === 'percent' ? 'Percent Off' : 'Amount Off ($)'} type="number" value={value} onChange={e => setValue(e.target.value)} placeholder={type === 'percent' ? '10' : '5.00'} required />
              <Input label="Max Uses" type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="Unlimited" />
              <div className="sm:col-span-4 flex gap-3">
                <Button type="submit" loading={saving} size="sm">Create Coupon</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>All Coupons</CardTitle></CardHeader>
        <CardContent className="p-0">
          {coupons.length === 0 ? (
            <EmptyState icon={<Tag size={32} />} title="No coupons yet" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  {['Code', 'Discount', 'Uses', 'Status', 'Created', ''].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-medium text-neutral-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {coupons.map(c => (
                  <tr key={c.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-3 font-mono font-medium text-black">{c.code}</td>
                    <td className="px-6 py-3 text-neutral-700">{c.type === 'percent' ? `${c.value}%` : `$${(c.value / 100).toFixed(2)}`} off</td>
                    <td className="px-6 py-3 text-neutral-600">{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ''}</td>
                    <td className="px-6 py-3"><Badge variant={c.active ? 'success' : 'neutral'}>{c.active ? 'Active' : 'Inactive'}</Badge></td>
                    <td className="px-6 py-3 text-neutral-500 text-xs">{formatDate(c.createdAt)}</td>
                    <td className="px-6 py-3">
                      <button onClick={() => toggleActive(c)} className="text-xs text-neutral-500 hover:text-black">{c.active ? 'Disable' : 'Enable'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
