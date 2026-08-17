'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Trash2, Upload, X, Copy, Store, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { slugify, formatCurrency } from '@/lib/utils'
import { uploadFile, buildStoragePath } from '@/lib/supabase/storage'
import { useAuth } from '@/context/auth-context'
import { MAX_PRODUCT_FILE_SIZE_BYTES, MAX_COVER_IMAGE_SIZE_BYTES } from '@/lib/platform-config'
import { CoverImageCreationShortcuts, ProductFileCreationShortcuts } from '@/components/dashboard/product-creation-shortcuts'

const CATEGORIES = ['Business', 'Money', 'Templates', 'Education', 'Real Estate', 'Faith', 'Fitness', 'Design', 'Other']
const COMMISSION_PRESETS = [10, 20, 30, 40, 50]

interface ProductFile {
  id: string
  file_name: string
  file_type: string
  file_size: number | null
  storage_path: string | null
  created_at: string
}

interface Product {
  id: string
  title: string
  slug: string
  description: string | null
  short_description: string | null
  price_cents: number | null
  cover_image_url: string | null
  image_url: string | null
  is_live: boolean
  access_message: string | null
  category: string | null
  marketplace_listing: boolean
  affiliate_enabled: boolean
  affiliate_commission_percent: number | null
  created_at: string
  updated_at: string
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { session } = useAuth()
  const [productId, setProductId] = useState<string | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [files, setFiles] = useState<ProductFile[]>([])
  const [salesCount, setSalesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [priceDollars, setPriceDollars] = useState('')
  const [isFree, setIsFree] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [category, setCategory] = useState('')
  const [marketplaceListing, setMarketplaceListing] = useState(true)
  const [affiliateEnabled, setAffiliateEnabled] = useState(true)
  const [affiliateCommission, setAffiliateCommission] = useState(30)
  const [customCommission, setCustomCommission] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [coverUploading, setCoverUploading] = useState(false)
  const [fileUploading, setFileUploading] = useState(false)

  useEffect(() => {
    params.then(({ id }) => {
      setProductId(id)
      fetch(`/api/products/${id}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) { router.push('/dashboard/products'); return }
          const p: Product = data.product
          setProduct(p)
          setFiles(data.files ?? [])
          setSalesCount(data.sales_count ?? 0)
          setTitle(p.title)
          setSlug(p.slug)
          setDescription(p.description ?? '')
          const priceCents = p.price_cents ?? 0
          setIsFree(priceCents === 0)
          setPriceDollars(priceCents > 0 ? (priceCents / 100).toFixed(2) : '')
          setIsLive(p.is_live)
          setCoverImageUrl(p.cover_image_url ?? p.image_url ?? null)
          setCategory(p.category ?? '')
          // Null means the product was created before these fields existed — default to ON
          setMarketplaceListing(p.marketplace_listing ?? true)
          setAffiliateEnabled(p.affiliate_enabled ?? true)
          const commPct = p.affiliate_commission_percent ?? 30
          if ([10, 20, 30, 40, 50].includes(commPct)) {
            setAffiliateCommission(commPct)
            setCustomCommission('')
          } else {
            setCustomCommission(commPct.toString())
          }
        })
        .catch(() => router.push('/dashboard/products'))
        .finally(() => setLoading(false))
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_COVER_IMAGE_SIZE_BYTES) { toast.error('Cover image must be under 5 MB.'); return }
    setCoverUploading(true)
    const path = buildStoragePath(session?.userId ?? 'unknown', file.name)
    const result = await uploadFile('product-images', path, file)
    if (result.error) { toast.error('Upload failed: ' + result.error) }
    else if (result.url) { setCoverImageUrl(result.url); toast.success('Cover image updated.') }
    setCoverUploading(false)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!productId) return
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_PRODUCT_FILE_SIZE_BYTES) { toast.error('File must be under 100 MB.'); return }
    setFileUploading(true)
    const path = buildStoragePath(session?.userId ?? 'unknown', file.name)
    const result = await uploadFile('product-files', path, file)
    if (result.error) {
      toast.error('Upload failed: ' + result.error)
    } else if (result.path) {
      const res = await fetch(`/api/products/${productId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_name: file.name, file_type: file.type, file_size: file.size, storage_path: result.path }),
      })
      const data = await res.json()
      if (res.ok && data.file) {
        setFiles(prev => [...prev, data.file])
        toast.success('File added.')
      } else {
        toast.error('Failed to register file.')
      }
    }
    setFileUploading(false)
  }

  async function handleDeleteFile(fileId: string) {
    if (!productId) return
    const res = await fetch(`/api/products/${productId}/files?fileId=${fileId}`, { method: 'DELETE' })
    if (res.ok) {
      setFiles(prev => prev.filter(f => f.id !== fileId))
      toast.success('File removed.')
    } else {
      toast.error('Failed to remove file.')
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!productId) return
    if (!title.trim()) return toast.error('Product title is required.')

    const priceCents = isFree ? 0 : Math.round(parseFloat(priceDollars || '0') * 100)
    if (!isFree && (isNaN(priceCents) || priceCents < 50)) {
      return toast.error('Price must be at least $0.50 for paid products.')
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          price_cents: priceCents,
          cover_image_url: coverImageUrl,
          is_live: isLive,
          category: category || null,
          marketplace_listing: marketplaceListing,
          affiliate_enabled: affiliateEnabled,
          affiliate_commission_percent: affiliateEnabled
            ? (customCommission ? parseInt(customCommission) || 0 : affiliateCommission)
            : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save.')
      setProduct(data.product)
      toast.success('Product saved.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!productId) return
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete.')
      toast.success('Product deleted.')
      router.push('/dashboard/products')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete.')
      setDeleting(false)
    }
  }

  async function handleCopyLink() {
    if (!slug) return
    await navigator.clipboard.writeText(`${window.location.origin}/p/${slug}`)
    toast.success('Link copied!')
  }

  if (loading) {
    return (
      <div className="max-w-2xl">
        <div className="h-8 w-48 bg-neutral-100 rounded animate-pulse mb-8" />
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-neutral-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (!product) return null

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-black transition-colors mb-4"
        >
          <ArrowLeft size={14} /> Products
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-black">{product.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={product.is_live ? 'success' : 'neutral'}>
                {product.is_live ? 'Live' : 'Draft'}
              </Badge>
              <span className="text-xs text-neutral-400">{salesCount} sales · {(product.price_cents ?? 0) === 0 ? 'Free' : formatCurrency(product.price_cents ?? 0)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="ghost" onClick={handleCopyLink}>
              <Copy size={13} /> Copy Link
            </Button>
            {product.is_live && (
              <Link href={`/p/${product.slug}`} target="_blank">
                <Button size="sm" variant="secondary"><ExternalLink size={13} /> View</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Details */}
        <Card>
          <CardHeader><CardTitle>Product Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Product Name *" value={title} onChange={e => setTitle(e.target.value)} required />
            <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} rows={5} placeholder="What does your product include?" />
          </CardContent>
        </Card>

        {/* Cover Image */}
        <Card>
          <CardHeader><CardTitle>Cover Image</CardTitle></CardHeader>
          <CardContent>
            {coverImageUrl ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setCoverImageUrl(null)} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full aspect-video rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 cursor-pointer hover:border-neutral-400 hover:bg-neutral-100 transition-all">
                {coverUploading ? (
                  <div className="w-5 h-5 border-2 border-neutral-400 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload size={22} className="text-neutral-400 mb-2" />
                    <p className="text-sm font-medium text-neutral-600">Upload cover image</p>
                    <p className="text-xs text-neutral-400 mt-1">JPG, PNG, WebP · Max 5 MB</p>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={coverUploading} />
              </label>
            )}
            <CoverImageCreationShortcuts />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isFree} onChange={e => setIsFree(e.target.checked)} className="w-4 h-4 rounded" />
              <span className="text-sm font-medium text-neutral-700">Free product</span>
            </label>
            {!isFree && (
              <Input
                label="Price (USD) *"
                type="number"
                min="0.50"
                step="0.01"
                value={priceDollars}
                onChange={e => setPriceDollars(e.target.value)}
                placeholder="29.00"
                required={!isFree}
              />
            )}
          </CardContent>
        </Card>

        {/* Files */}
        <Card>
          <CardHeader><CardTitle>Digital Files</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map(f => (
                  <div key={f.id} className="flex items-center gap-3 bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-200">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.file_name}</p>
                      <p className="text-xs text-neutral-400">{f.file_size ? `${(f.file_size / 1024 / 1024).toFixed(1)} MB` : ''}</p>
                    </div>
                    <button type="button" onClick={() => handleDeleteFile(f.id)} className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-neutral-600 hover:text-black transition-colors py-3 border border-dashed border-neutral-200 rounded-xl justify-center">
              {fileUploading ? (
                <div className="w-4 h-4 border-2 border-neutral-400 border-t-black rounded-full animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              {fileUploading ? 'Uploading…' : files.length > 0 ? 'Add another file' : 'Upload product file'}
              <input type="file" className="hidden" onChange={handleFileUpload} disabled={fileUploading} />
            </label>
            <ProductFileCreationShortcuts />
            <p className="text-xs text-neutral-400">Files are stored privately and delivered securely after purchase.</p>
          </CardContent>
        </Card>

        {/* Product URL */}
        <Card>
          <CardHeader><CardTitle>Product URL</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center rounded-xl border border-neutral-200 overflow-hidden">
              <span className="px-3 py-2.5 text-sm text-neutral-500 bg-neutral-50 border-r border-neutral-200 shrink-0">
                sellbop.com/p/
              </span>
              <input
                type="text"
                value={slug}
                onChange={e => setSlug(slugify(e.target.value))}
                className="flex-1 px-3 py-2.5 text-sm font-mono focus:outline-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Category */}
        <Card>
          <CardHeader><CardTitle>Category</CardTitle></CardHeader>
          <CardContent>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 bg-white focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value="">No category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </CardContent>
        </Card>

        {/* Marketplace */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store size={16} className="text-neutral-500" />
              Marketplace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex items-center justify-between cursor-pointer select-none">
              <div>
                <p className="text-sm font-medium text-neutral-800">List in Sellbop Marketplace</p>
                <p className="text-xs text-neutral-500 mt-0.5">Let people discover this product while browsing Sellbop.</p>
              </div>
              <button
                type="button"
                onClick={() => setMarketplaceListing(v => !v)}
                className={`relative flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 ${marketplaceListing ? 'bg-black' : 'bg-neutral-200'}`}
              >
                <span className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${marketplaceListing ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
              </button>
            </label>
          </CardContent>
        </Card>

        {/* Sellbop Share */}
        {(() => {
          const priceCentsPreview = isFree ? 0 : Math.round(parseFloat(priceDollars || '0') * 100)
          const commPercent = affiliateEnabled ? (customCommission ? parseInt(customCommission) || 0 : affiliateCommission) : 0
          const commCents = Math.floor(priceCentsPreview * (commPercent / 100))
          return (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-600" />
                  Sellbop Share
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <div>
                    <p className="text-sm font-medium text-neutral-800">Affiliate Sharing</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Let other people sell this product for you. You only pay commission when they make a sale.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAffiliateEnabled(v => !v)}
                    className={`relative flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 ${affiliateEnabled ? 'bg-emerald-500' : 'bg-neutral-200'}`}
                  >
                    <span className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${affiliateEnabled ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                  </button>
                </label>

                {affiliateEnabled && (
                  <div className="space-y-3 border-t border-neutral-100 pt-3">
                    <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Affiliate Commission</p>
                    <div className="flex gap-2 flex-wrap">
                      {COMMISSION_PRESETS.map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => { setAffiliateCommission(p); setCustomCommission('') }}
                          className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition-all ${
                            !customCommission && affiliateCommission === p
                              ? 'bg-black text-white'
                              : 'border border-neutral-200 text-neutral-700 hover:border-black hover:text-black'
                          }`}
                        >
                          {p}%
                        </button>
                      ))}
                      <input
                        type="number"
                        min="1"
                        max="95"
                        placeholder="Custom %"
                        value={customCommission}
                        onChange={e => setCustomCommission(e.target.value)}
                        className="w-28 rounded-xl border border-neutral-200 px-3 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                    {priceCentsPreview > 0 && commPercent > 0 && (
                      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-neutral-600">Product price</span>
                          <span className="font-medium">{formatCurrency(priceCentsPreview)}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-neutral-600">Commission ({commPercent}%)</span>
                          <span className="font-medium text-emerald-700">−{formatCurrency(commCents)}</span>
                        </div>
                        <div className="border-t border-emerald-200 pt-2 flex justify-between">
                          <span className="font-bold text-emerald-800">Affiliate earns per sale</span>
                          <span className="text-xl font-black text-emerald-700">{formatCurrency(commCents)}</span>
                        </div>
                        <p className="mt-2 text-[11px] text-emerald-600">Platform fee and payment processing apply to your remainder.</p>
                      </div>
                    )}
                    {priceCentsPreview === 0 && (
                      <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                        Affiliate commissions only apply to paid products.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })()}

        {/* Visibility */}
        <Card>
          <CardHeader><CardTitle>Visibility</CardTitle></CardHeader>
          <CardContent>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isLive} onChange={e => setIsLive(e.target.checked)} className="w-4 h-4 rounded" />
              <span className="text-sm font-medium text-neutral-700">Published (visible to buyers)</span>
            </label>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pb-8">
          <div className="flex items-center gap-3">
            <Button type="submit" loading={saving} disabled={fileUploading || coverUploading}>
              Save Changes
            </Button>
            <Link href="/dashboard/products">
              <Button type="button" variant="secondary">Cancel</Button>
            </Link>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={handleDelete}
            loading={deleting}
            className="text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={14} /> Delete
          </Button>
        </div>
      </form>
    </div>
  )
}
