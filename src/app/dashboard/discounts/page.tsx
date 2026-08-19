'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Tag, Trash2, Plus } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/env'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useUserStore } from '@/hooks/use-user-store'

interface DiscountCode {
  id: string
  code: string
  discount_type: string
  discount_value: number
  max_uses: number | null
  used_count: number
  active: boolean
  expires_at: string | null
  created_at: string
}

export default function DiscountsPage() {
  const { session } = useAuth()
  const { store, activeStoreId, storeVersion } = useUserStore()
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Form
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [discountValue, setDiscountValue] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  useEffect(() => {
    if (!session || !store || !activeStoreId || !isSupabaseConfigured()) { setLoading(false); return }
    setLoading(true)
    const supabase = getSupabaseBrowserClient()
    if (!supabase) { setLoading(false); return }
    supabase
      .from('discount_codes')
      .select('*')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setCodes(data ?? [])
        setLoading(false)
      })
  }, [session, store?.id, activeStoreId, storeVersion])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!session || !store || !code.trim() || !discountValue) return
    const val = parseInt(discountValue)
    if (isNaN(val) || val <= 0) return toast.error('Invalid discount value.')
    if (discountType === 'percent' && val > 100) return toast.error('Percentage cannot exceed 100.')
    setCreating(true)
    const supabase = getSupabaseBrowserClient()
    if (!supabase) { toast.error('Not connected.'); setCreating(false); return }
    const { data, error } = await supabase
      .from('discount_codes')
      .insert({
        store_id: store.id,
        seller_id: session.userId,
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: discountType === 'fixed' ? Math.round(parseFloat(discountValue) * 100) : val,
        max_uses: maxUses ? parseInt(maxUses) : null,
        expires_at: expiresAt || null,
        active: true,
      })
      .select('*')
      .single()
    if (error) { toast.error(error.message) }
    else { setCodes(prev => [data, ...prev]); toast.success('Discount code created.'); setShowForm(false); setCode(''); setDiscountValue('') }
    setCreating(false)
  }

  async function handleToggle(id: string, active: boolean) {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return
    await supabase.from('discount_codes').update({ active: !active }).eq('id', id)
    setCodes(prev => prev.map(c => c.id === id ? { ...c, active: !active } : c))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this discount code?')) return
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return
    await supabase.from('discount_codes').delete().eq('id', id)
    setCodes(prev => prev.filter(c => c.id !== id))
    toast.success('Discount code deleted.')
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-black">Discounts</h1>
          <p className="mt-1 text-sm text-neutral-500">Create coupon codes for your products.</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(v => !v)}>
          <Plus size={14} /> New Code
        </Button>
      </div>

      {showForm && (
        <Card className="mb-5">
          <CardHeader><CardTitle>Create Discount Code</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Code *"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="SUMMER20"
                className="font-mono uppercase"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Type</label>
                  <select
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value as 'percent' | 'fixed')}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm focus:outline-none"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>
                <Input
                  label={discountType === 'percent' ? 'Percent off *' : 'Dollars off *'}
                  type="number"
                  min="1"
                  max={discountType === 'percent' ? '100' : undefined}
                  step={discountType === 'fixed' ? '0.01' : '1'}
                  value={discountValue}
                  onChange={e => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percent' ? '20' : '10.00'}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Max uses (optional)"
                  type="number"
                  min="1"
                  value={maxUses}
                  onChange={e => setMaxUses(e.target.value)}
                  placeholder="∞"
                />
                <Input
                  label="Expires at (optional)"
                  type="date"
                  value={expiresAt}
                  onChange={e => setExpiresAt(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" loading={creating}>Create Code</Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Discount Codes</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="px-6 py-10 space-y-3">
              {[1,2].map(i => <div key={i} className="h-12 bg-neutral-100 rounded animate-pulse" />)}
            </div>
          ) : codes.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Tag size={32} className="mx-auto mb-3 text-neutral-200" />
              <p className="text-sm font-medium text-neutral-700 mb-1">No discount codes yet</p>
              <p className="text-xs text-neutral-400">Create discount codes to offer deals to your customers.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-50">
              {codes.map(c => (
                <div key={c.id} className="px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-sm font-mono font-bold text-black">{c.code}</code>
                      <Badge variant={c.active ? 'success' : 'neutral'}>{c.active ? 'Active' : 'Inactive'}</Badge>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {c.discount_type === 'percent'
                        ? `${c.discount_value}% off`
                        : `${formatCurrency(c.discount_value)} off`}
                      {' · '}{c.used_count} uses{c.max_uses ? ` / ${c.max_uses}` : ''}
                      {c.expires_at ? ` · Expires ${new Date(c.expires_at).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => handleToggle(c.id, c.active)}>
                      {c.active ? 'Disable' : 'Enable'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)} className="text-red-500 hover:bg-red-50">
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
