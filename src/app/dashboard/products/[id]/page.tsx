'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { demoProductRepo } from '@/lib/adapters/demo/repositories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Toggle } from '@/components/ui/toggle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ImageUpload } from '@/components/dashboard/image-upload'
import { toast } from 'sonner'
import { slugify, formatCurrency, formatDate } from '@/lib/utils'
import {
  BarChart3,
  ExternalLink,
  ArrowLeft,
  Users,
  FileText,
  Rss,
  Star,
  Tag,
  LayoutDashboard,
  Pencil,
  Plus,
  Trash2,
  CheckCircle2,
  Link2,
} from 'lucide-react'
import type { Product, ProductType } from '@/lib/domain/entities'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPES = [
  { value: 'digital_download', label: 'Digital Download' },
  { value: 'service_offer', label: 'Service Offer' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'bundle', label: 'Bundle' },
]
const CTA_OPTIONS = [
  { value: 'Get Instant Access', label: 'Get Instant Access' },
  { value: 'Buy Now', label: 'Buy Now' },
  { value: 'Book and Pay', label: 'Book and Pay' },
  { value: 'Join the Membership', label: 'Join the Membership' },
  { value: 'Start Subscription', label: 'Start Subscription' },
  { value: 'Download Now', label: 'Download Now' },
  { value: 'Get the Bundle', label: 'Get the Bundle' },
]

// ── Grouped tabs (5 sections) ─────────────────────────────────────────────────
type HubTab = 'overview' | 'content' | 'customers' | 'growth' | 'settings'
type ContentSub = 'edit' | 'files' | 'updates'
type CustomersSub = 'customers' | 'reviews'
type GrowthSub = 'coupons' | 'affiliates'

const HUB_TABS: { key: HubTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'content', label: 'Content', icon: Pencil },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'growth', label: 'Growth', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: Tag },
]

// ── Types for local state ─────────────────────────────────────────────────────

interface ProductFile {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
  visibility: 'buyers' | 'public' | 'private'
}

interface ProductUpdate {
  id: string
  title: string
  body: string
  linkUrl: string
  linkLabel: string
  status: 'draft' | 'published'
  createdAt: string
}

interface ProductReview {
  id: string
  customerName: string
  customerEmail: string
  rating: number
  message: string
  approved: boolean
  createdAt: string
}

interface AffiliateLink {
  id: string
  affiliateCode: string
  affiliateName: string
  commissionPct: number
  enabled: boolean
  totalClicks: number
  totalOrders: number
  totalRevenue: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function TabBar({ tab, onChange }: { tab: HubTab; onChange: (t: HubTab) => void }) {
  return (
    <div className="flex gap-0 border-b border-neutral-100 overflow-x-auto scrollbar-none pr-4">
      {HUB_TABS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            'flex items-center gap-1.5 whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors shrink-0',
            tab === key
              ? 'border-black text-black'
              : 'border-transparent text-neutral-500 hover:text-black',
          )}
        >
          <Icon size={13} />
          {label}
        </button>
      ))}
    </div>
  )
}

function SubTabBar<T extends string>({
  items,
  active,
  onChange,
}: {
  items: { key: T; label: string }[]
  active: T
  onChange: (t: T) => void
}) {
  return (
    <div className="flex items-center gap-1 mb-5 border-b border-neutral-100 pb-0 overflow-x-auto scrollbar-none pr-2">
      {items.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0',
            active === key
              ? 'border-neutral-900 text-black'
              : 'border-transparent text-neutral-400 hover:text-black',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          className={n <= rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'}
        />
      ))}
    </div>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ product, onTabChange }: { product: Product; onTabChange: (t: HubTab) => void }) {
  const revenue = product.salesCount * product.price
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Sales', value: product.salesCount.toString() },
          { label: 'Revenue', value: formatCurrency(revenue) },
          { label: 'Views', value: product.viewCount.toString() },
          {
            label: 'Conversion',
            value: product.viewCount > 0
              ? `${((product.salesCount / product.viewCount) * 100).toFixed(1)}%`
              : '—',
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-xs text-neutral-500">{stat.label}</p>
            <p className="mt-1 text-xl font-bold text-black">{stat.value}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-start gap-4">
            {product.thumbnailUrl && (
              <img
                src={product.thumbnailUrl}
                alt={product.name}
                className="h-16 w-16 rounded-lg object-cover flex-shrink-0 border border-neutral-100"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-black">{product.name}</p>
                <Badge variant={product.status === 'published' ? 'success' : 'warning'}>
                  {product.status === 'published' ? 'Live' : product.status}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-neutral-500">
                {formatCurrency(product.price)} · {product.productType.replace('_', ' ')}
              </p>
              {product.publishedAt && (
                <p className="mt-0.5 text-xs text-neutral-400">
                  Published {formatDate(product.publishedAt)}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-50">
            {product.status === 'published' && (
              <Link href={`/p/${product.slug}`} target="_blank">
                <Button size="sm" variant="secondary">
                  <ExternalLink size={13} /> View Product Page
                </Button>
              </Link>
            )}
            <Button size="sm" variant="ghost" onClick={() => onTabChange('content')}>
              <Pencil size={13} /> Edit Product
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onTabChange('growth')}>
              <BarChart3 size={13} /> Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-xs text-neutral-500 space-y-1">
        <p><span className="font-medium text-neutral-700">Product URL:</span>{' '}
          <a href={`/p/${product.slug}`} target="_blank" className="underline underline-offset-2 hover:text-black">
            /p/{product.slug}
          </a>
        </p>
        <p><span className="font-medium text-neutral-700">Created:</span> {formatDate(product.createdAt)}</p>
      </div>
    </div>
  )
}

// ── Edit Tab ──────────────────────────────────────────────────────────────────

function EditTab({
  product,
  onSaved,
  onDeleted,
  fromEditor,
}: {
  product: Product
  onSaved: () => void
  onDeleted: () => void
  fromEditor: boolean
}) {
  const router = useRouter()
  const [name, setName] = useState(product.name)
  const [slug, setSlug] = useState(product.slug)
  const [description, setDescription] = useState(product.description)
  const [shortDescription, setShortDescription] = useState(product.shortDescription ?? '')
  const [productType, setProductType] = useState<ProductType>(product.productType)
  const [price, setPrice] = useState(String(product.price / 100))
  const [compareAtPrice, setCompareAtPrice] = useState(
    product.compareAtPrice ? String(product.compareAtPrice / 100) : '',
  )
  const [ctaText, setCtaText] = useState(product.ctaText)
  const [externalUrl, setExternalUrl] = useState(product.externalUrl ?? '')
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(product.thumbnailUrl)
  const [published, setPublished] = useState(product.status === 'published')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await demoProductRepo.update(product.id, {
        name, slug, description,
        shortDescription: shortDescription || null,
        productType,
        status: published ? 'published' : 'draft',
        price: Math.round(parseFloat(price) * 100),
        compareAtPrice: compareAtPrice ? Math.round(parseFloat(compareAtPrice) * 100) : null,
        ctaText,
        externalUrl: externalUrl || null,
        thumbnailUrl,
        coverImageUrl: thumbnailUrl,
        publishedAt: published ? (product.publishedAt || new Date().toISOString()) : null,
      })
      toast.success('Product updated.')
      onSaved()
    } catch {
      toast.error('Failed to update product.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this product? This cannot be undone.')) return
    setDeleting(true)
    await demoProductRepo.delete(product.id)
    toast.success('Product deleted.')
    onDeleted()
    router.push(fromEditor ? '/dashboard/store-editor' : '/dashboard/products')
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <Card>
        <CardHeader><CardTitle>Basics</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input label="Product Name *" value={name} onChange={e => setName(e.target.value)} required />
          <Input label="Slug *" value={slug} onChange={e => setSlug(slugify(e.target.value))} hint={`/p/${slug}`} required />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Product Type" value={productType} onChange={e => setProductType(e.target.value as ProductType)} options={TYPES} />
            <Select label="CTA Button" value={ctaText} onChange={e => setCtaText(e.target.value)} options={CTA_OPTIONS} />
          </div>
          <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} rows={4} />
          <Input label="Short Description" value={shortDescription} onChange={e => setShortDescription(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Media</CardTitle></CardHeader>
        <CardContent>
          <ImageUpload value={thumbnailUrl} onChange={setThumbnailUrl} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (USD) *" type="number" value={price} onChange={e => setPrice(e.target.value)} step="0.01" required />
            <Input label="Compare-at Price" type="number" value={compareAtPrice} onChange={e => setCompareAtPrice(e.target.value)} step="0.01" hint="Strikethrough price" />
          </div>
        </CardContent>
      </Card>

      {(productType === 'service_offer' || productType === 'subscription') && (
        <Card>
          <CardHeader><CardTitle>Fulfillment</CardTitle></CardHeader>
          <CardContent>
            <Input label="Booking / Access Link" type="url" value={externalUrl} onChange={e => setExternalUrl(e.target.value)} placeholder="https://cal.com/yourname" />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-900">Published</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {published ? `Live at /p/${slug}` : 'Draft — not publicly visible'}
              </p>
            </div>
            <Toggle checked={published} onChange={setPublished} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <Button type="submit" loading={saving}>Save Changes</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        </div>
        <Button type="button" variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
      </div>
    </form>
  )
}

// ── Files Tab ─────────────────────────────────────────────────────────────────

function FilesTab({ productSlug }: { productSlug: string }) {
  const [files, setFiles] = useState<ProductFile[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fileName, setFileName] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileType, setFileType] = useState('link')

  const FILE_TYPES = [
    { value: 'link', label: 'External Link' },
    { value: 'pdf', label: 'PDF' },
    { value: 'zip', label: 'ZIP Archive' },
    { value: 'video', label: 'Video' },
    { value: 'audio', label: 'Audio' },
    { value: 'image', label: 'Image' },
    { value: 'other', label: 'Other' },
  ]

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/v5/product-files?slug=${encodeURIComponent(productSlug)}`)
        const data = (await res.json()) as { files?: Array<{
          id: string; file_name: string; file_url: string; file_type: string; visibility: string
        }> }
        if (!active) return
        setFiles((data.files ?? []).map(f => ({
          id: f.id,
          fileName: f.file_name,
          fileUrl: f.file_url,
          fileType: f.file_type,
          visibility: f.visibility as 'buyers' | 'public' | 'private',
        })))
      } catch {
        // Supabase not available — start with empty list
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [productSlug])

  async function handleAdd() {
    if (!fileName.trim() || !fileUrl.trim()) {
      toast.error('File name and URL are required.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/v5/product-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: productSlug, fileName: fileName.trim(), fileUrl: fileUrl.trim(), fileType }),
      })
      const data = (await res.json()) as { file?: { id: string; file_name?: string; fileName?: string; file_url?: string; fileUrl?: string; file_type?: string; fileType?: string; visibility?: string }; persisted?: boolean }
      const raw = data.file
      if (raw) {
        setFiles(prev => [...prev, {
          id: raw.id,
          fileName: raw.file_name ?? raw.fileName ?? fileName.trim(),
          fileUrl: raw.file_url ?? raw.fileUrl ?? fileUrl.trim(),
          fileType: raw.file_type ?? raw.fileType ?? fileType,
          visibility: (raw.visibility ?? 'buyers') as 'buyers' | 'public' | 'private',
        }])
      }
      setFileName(''); setFileUrl(''); setFileType('link')
      setAdding(false)
      toast.success(data.persisted ? 'File saved to Supabase.' : 'File added (local session).')
    } catch {
      toast.error('Could not save file. Try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(id: string) {
    setFiles(prev => prev.filter(f => f.id !== id))
    try {
      await fetch(`/api/v5/product-files/${id}`, { method: 'DELETE' })
      toast.success('File removed.')
    } catch {
      toast.error('Could not delete from Supabase.')
    }
  }

  const fileTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return '📄'
      case 'zip': return '🗜️'
      case 'video': return '🎬'
      case 'audio': return '🎵'
      case 'image': return '🖼️'
      case 'link': return '🔗'
      default: return '📁'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-black">Product Files</p>
          <p className="text-xs text-neutral-500 mt-0.5">
            Attach files or links. Buyers see these after purchase.
          </p>
        </div>
        {!adding && !loading && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus size={13} /> Add File
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-6 text-sm text-neutral-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
          Loading files…
        </div>
      )}

      {adding && (
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="File Name *" value={fileName} onChange={e => setFileName(e.target.value)} placeholder="e.g. Starter Kit.zip" />
              <Select label="File Type" value={fileType} onChange={e => setFileType(e.target.value)} options={FILE_TYPES} />
            </div>
            <Input label="File URL *" value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://..." type="url" hint="Paste a direct link or Supabase storage URL" />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} loading={saving}>Save File</Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {files.length === 0 && !adding && !loading ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
          <FileText size={28} className="mx-auto mb-2 text-neutral-300" />
          <p className="text-sm font-medium text-neutral-700">Add product access</p>
          <p className="mt-1 text-xs text-neutral-400">
            Add files, links, or access instructions to deliver your product to buyers.
          </p>
          <Button size="sm" className="mt-4" onClick={() => setAdding(true)}>
            <Plus size={13} /> Add file or link
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3"
            >
              <span className="text-lg leading-none">{fileTypeIcon(file.fileType)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-black truncate">{file.fileName}</p>
                <p className="text-xs text-neutral-400 truncate">{file.fileUrl}</p>
              </div>
              <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
                {file.visibility}
              </span>
              <button
                onClick={() => handleRemove(file.id)}
                className="ml-1 text-neutral-300 hover:text-red-500 transition-colors"
                aria-label="Remove file"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
        Files are saved to Supabase when the product is live. Add an external file URL or a
        Supabase Storage signed URL. Buyers see files after purchase.
      </div>
    </div>
  )
}

// ── Updates Tab ───────────────────────────────────────────────────────────────

function UpdatesTab({ productSlug }: { productSlug: string }) {
  const [updates, setUpdates] = useState<ProductUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkLabel, setLinkLabel] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/v5/product-updates?slug=${encodeURIComponent(productSlug)}`)
        const data = (await res.json()) as { updates?: Array<{
          id: string; title: string; body: string; link_url: string | null; link_label: string | null; status: string; created_at: string
        }> }
        if (!active) return
        setUpdates((data.updates ?? []).map(u => ({
          id: u.id,
          title: u.title,
          body: u.body ?? '',
          linkUrl: u.link_url ?? '',
          linkLabel: u.link_label ?? '',
          status: u.status as 'draft' | 'published',
          createdAt: u.created_at,
        })))
      } catch {
        // Supabase not available
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [productSlug])

  async function handleAdd() {
    if (!title.trim()) {
      toast.error('Title is required.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/v5/product-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: productSlug,
          title: title.trim(),
          body: body.trim(),
          linkUrl: linkUrl.trim() || undefined,
          linkLabel: linkLabel.trim() || undefined,
          status,
        }),
      })
      const data = (await res.json()) as { update?: { id: string; title: string; body: string; link_url?: string; linkUrl?: string; link_label?: string; linkLabel?: string; status: string; created_at?: string; createdAt?: string }; persisted?: boolean }
      const raw = data.update
      if (raw) {
        setUpdates(prev => [{
          id: raw.id,
          title: raw.title,
          body: raw.body,
          linkUrl: raw.link_url ?? raw.linkUrl ?? '',
          linkLabel: raw.link_label ?? raw.linkLabel ?? '',
          status: raw.status as 'draft' | 'published',
          createdAt: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
        }, ...prev])
      }
      setTitle(''); setBody(''); setLinkUrl(''); setLinkLabel(''); setStatus('draft')
      setAdding(false)
      toast.success(
        status === 'published'
          ? `Update published${data.persisted ? ' to Supabase' : ''} — buyers can see it.`
          : `Update saved as draft${data.persisted ? ' to Supabase' : ''}.`,
      )
    } catch {
      toast.error('Could not save update. Try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus(id: string) {
    const update = updates.find(u => u.id === id)
    if (!update) return
    const newStatus = update.status === 'published' ? 'draft' : 'published'
    setUpdates(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u))
    try {
      await fetch(`/api/v5/product-updates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch {
      // Best-effort — local state already updated
    }
  }

  async function handleRemove(id: string) {
    setUpdates(prev => prev.filter(u => u.id !== id))
    try {
      await fetch(`/api/v5/product-updates/${id}`, { method: 'DELETE' })
      toast.success('Update deleted.')
    } catch {
      toast.error('Could not delete from Supabase.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-black">Buyer Updates</p>
          <p className="text-xs text-neutral-500 mt-0.5">
            Post updates only buyers of this product can see.
          </p>
        </div>
        {!adding && !loading && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus size={13} /> New Update
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-6 text-sm text-neutral-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
          Loading updates…
        </div>
      )}

      {adding && (
        <Card>
          <CardContent className="pt-5 space-y-4">
            <Input label="Title *" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Version 2.0 is here!" />
            <Textarea label="Body" value={body} onChange={e => setBody(e.target.value)} rows={4} placeholder="Share what's new..." />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Link URL" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." type="url" />
              <Input label="Link Label" value={linkLabel} onChange={e => setLinkLabel(e.target.value)} placeholder="Download v2.0" />
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-neutral-50">
              <div className="flex items-center gap-2">
                <Toggle
                  checked={status === 'published'}
                  onChange={(v) => setStatus(v ? 'published' : 'draft')}
                />
                <span className="text-sm text-neutral-600">
                  {status === 'published' ? 'Publish now' : 'Save as draft'}
                </span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAdd} loading={saving}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {updates.length === 0 && !adding && !loading ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
          <Rss size={28} className="mx-auto mb-2 text-neutral-300" />
          <p className="text-sm font-medium text-neutral-500">No updates yet</p>
          <p className="mt-1 text-xs text-neutral-400">
            Post buyer-only updates like new versions, bonus content, or announcements.
          </p>
          <Button size="sm" className="mt-4" onClick={() => setAdding(true)}>
            <Plus size={13} /> Post First Update
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {updates.map((u) => (
            <div key={u.id} className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-black">{u.title}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      u.status === 'published'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-neutral-200 bg-neutral-100 text-neutral-500'
                    }`}>
                      {u.status}
                    </span>
                  </div>
                  {u.body && <p className="mt-1.5 text-sm text-neutral-600 leading-relaxed">{u.body}</p>}
                  {u.linkUrl && (
                    <a href={u.linkUrl} target="_blank" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-black underline underline-offset-2 hover:no-underline">
                      <Link2 size={11} /> {u.linkLabel || u.linkUrl}
                    </a>
                  )}
                  <p className="mt-2 text-xs text-neutral-400">{formatDate(u.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleToggleStatus(u.id)}
                  >
                    {u.status === 'published' ? 'Unpublish' : 'Publish'}
                  </Button>
                  <button
                    onClick={() => handleRemove(u.id)}
                    className="text-neutral-300 hover:text-red-500 transition-colors"
                    aria-label="Delete update"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Customers Tab ─────────────────────────────────────────────────────────────

function CustomersTab({ product }: { product: Product }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="font-semibold text-black">Customers</p>
        <p className="text-xs text-neutral-500 mt-0.5">
          Buyers who purchased this product.
        </p>
      </div>
      {product.salesCount === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
          <Users size={28} className="mx-auto mb-2 text-neutral-300" />
          <p className="text-sm font-medium text-neutral-500">No customers yet</p>
          <p className="mt-1 text-xs text-neutral-400">
            Customers will appear here once someone purchases this product.
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100 mb-4">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-emerald-700">
                <span className="font-semibold">{product.salesCount} purchase{product.salesCount !== 1 ? 's' : ''}</span> — customer details available in Orders.
              </p>
            </div>
            <Link href="/dashboard/orders">
              <Button size="sm" variant="secondary">
                <Users size={13} /> View in Orders
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Coupons Tab ───────────────────────────────────────────────────────────────

function CouponsTab() {
  return (
    <div className="space-y-4">
      <div>
        <p className="font-semibold text-black">Coupons</p>
        <p className="text-xs text-neutral-500 mt-0.5">
          Create discount codes for this product.
        </p>
      </div>
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
        <Tag size={28} className="mx-auto mb-2 text-neutral-300" />
        <p className="text-sm font-medium text-neutral-500">Coupons coming soon</p>
        <p className="mt-1 text-xs text-neutral-400">
          Global discounts are available in <Link href="/dashboard/discounts" className="underline">Discounts</Link>.
          Per-product coupons will be added in a future update.
        </p>
        <Link href="/dashboard/discounts" className="mt-4 inline-block">
          <Button size="sm" variant="secondary">
            <Tag size={13} /> Go to Discounts
          </Button>
        </Link>
      </div>
    </div>
  )
}

// ── Reviews Tab ───────────────────────────────────────────────────────────────

function ReviewsTab({ productSlug }: { productSlug: string }) {
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [rating, setRating] = useState(5)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/v5/product-reviews?slug=${encodeURIComponent(productSlug)}`)
        const data = (await res.json()) as { reviews?: Array<{
          id: string; customer_name: string; customer_email: string | null; rating: number; message: string; approved: boolean; created_at: string
        }> }
        if (!active) return
        setReviews((data.reviews ?? []).map(r => ({
          id: r.id,
          customerName: r.customer_name,
          customerEmail: r.customer_email ?? '',
          rating: r.rating,
          message: r.message,
          approved: r.approved,
          createdAt: r.created_at,
        })))
      } catch {
        // Supabase not available
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [productSlug])

  async function handleAdd() {
    if (!customerName.trim() || !message.trim()) {
      toast.error('Name and message are required.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/v5/product-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: productSlug,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim() || undefined,
          rating,
          message: message.trim(),
        }),
      })
      const data = (await res.json()) as { review?: { id: string; customer_name?: string; customerName?: string; customer_email?: string | null; customerEmail?: string | null; rating: number; message: string; approved: boolean; created_at?: string; createdAt?: string }; persisted?: boolean }
      const raw = data.review
      if (raw) {
        setReviews(prev => [{
          id: raw.id,
          customerName: raw.customer_name ?? raw.customerName ?? customerName.trim(),
          customerEmail: raw.customer_email ?? raw.customerEmail ?? customerEmail.trim(),
          rating: raw.rating,
          message: raw.message,
          approved: raw.approved,
          createdAt: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
        }, ...prev])
      }
      setCustomerName(''); setCustomerEmail(''); setRating(5); setMessage('')
      setAdding(false)
      toast.success(data.persisted ? 'Review saved to Supabase. Approve it to show on the product page.' : 'Review added. Approve it to show on the product page.')
    } catch {
      toast.error('Could not save review. Try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleApproval(id: string) {
    const review = reviews.find(r => r.id === id)
    if (!review) return
    const newApproved = !review.approved
    setReviews(prev => prev.map(r => r.id === id ? { ...r, approved: newApproved } : r))
    try {
      await fetch(`/api/v5/product-reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: newApproved }),
      })
    } catch {
      // Best-effort
    }
  }

  async function handleRemove(id: string) {
    setReviews(prev => prev.filter(r => r.id !== id))
    try {
      await fetch(`/api/v5/product-reviews/${id}`, { method: 'DELETE' })
      toast.success('Review deleted.')
    } catch {
      toast.error('Could not delete from Supabase.')
    }
  }

  const approvedCount = reviews.filter(r => r.approved).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-black">Reviews & Testimonials</p>
          <p className="text-xs text-neutral-500 mt-0.5">
            {loading ? 'Loading…' : `${approvedCount} approved · ${reviews.length} total. Approved reviews show on the product page.`}
          </p>
        </div>
        {!adding && !loading && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus size={13} /> Add Review
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-6 text-sm text-neutral-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
          Loading reviews…
        </div>
      )}

      {adding && (
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Customer Name *" value={customerName} onChange={e => setCustomerName(e.target.value)} />
              <Input label="Customer Email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} type="email" />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-neutral-600">Rating *</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className="p-0.5 transition-transform hover:scale-110"
                  >
                    <Star
                      size={22}
                      className={n <= rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'}
                    />
                  </button>
                ))}
              </div>
            </div>
            <Textarea label="Message *" value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="What did the customer say?" />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} loading={saving}>Add Review</Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {reviews.length === 0 && !adding && !loading ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
          <Star size={28} className="mx-auto mb-2 text-neutral-300" />
          <p className="text-sm font-medium text-neutral-500">No reviews yet</p>
          <p className="mt-1 text-xs text-neutral-400">
            Add customer testimonials. Approved reviews appear on your product page.
          </p>
          <Button size="sm" className="mt-4" onClick={() => setAdding(true)}>
            <Plus size={13} /> Add First Review
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-black text-sm">{review.customerName}</p>
                    <Stars rating={review.rating} />
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      review.approved
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-neutral-200 bg-neutral-100 text-neutral-500'
                    }`}>
                      {review.approved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 leading-relaxed">{review.message}</p>
                  <p className="mt-2 text-xs text-neutral-400">{formatDate(review.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="xs"
                    variant={review.approved ? 'ghost' : 'secondary'}
                    onClick={() => handleToggleApproval(review.id)}
                  >
                    {review.approved ? 'Unapprove' : 'Approve'}
                  </Button>
                  <button
                    onClick={() => handleRemove(review.id)}
                    className="text-neutral-300 hover:text-red-500 transition-colors"
                    aria-label="Delete review"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Analytics Tab ─────────────────────────────────────────────────────────────

function AnalyticsTab({ product }: { product: Product }) {
  const revenue = product.salesCount * product.price
  const conversionRate = product.viewCount > 0
    ? ((product.salesCount / product.viewCount) * 100).toFixed(1)
    : '0.0'

  const stats = [
    { label: 'Total Views', value: product.viewCount.toLocaleString(), sub: 'product page visits' },
    { label: 'Checkout Starts', value: '—', sub: 'tracking coming soon' },
    { label: 'Purchases', value: product.salesCount.toLocaleString(), sub: 'completed orders' },
    { label: 'Conversion Rate', value: `${conversionRate}%`, sub: 'views → purchases' },
    { label: 'Total Revenue', value: formatCurrency(revenue), sub: 'gross revenue' },
    { label: 'Avg Order Value', value: product.salesCount > 0 ? formatCurrency(revenue / product.salesCount) : '—', sub: 'per purchase' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="font-semibold text-black">Analytics</p>
        <p className="text-xs text-neutral-500 mt-0.5">
          Performance data for this product.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-xs text-neutral-500">{stat.label}</p>
            <p className="mt-1 text-xl font-bold text-black">{stat.value}</p>
            <p className="mt-0.5 text-[11px] text-neutral-400">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
        Detailed analytics (traffic sources, geographic breakdown, time series) will be available
        when event tracking is connected. All-product analytics live in{' '}
        <Link href="/dashboard/analytics" className="underline">Analytics</Link>.
      </div>
    </div>
  )
}

// ── Affiliate Tab ─────────────────────────────────────────────────────────────

function AffiliateSection({ product }: { product: Product }) {
  const [links, setLinks] = useState<AffiliateLink[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [affiliateName, setAffiliateName] = useState('')
  const [affiliateEmail, setAffiliateEmail] = useState('')
  const [commissionPct, setCommissionPct] = useState('30')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/v5/affiliate-links?slug=${encodeURIComponent(product.slug)}`)
        const data = (await res.json()) as { links?: Array<{
          id: string; affiliate_code: string; affiliate_name: string | null; commission_pct: number; enabled: boolean; total_clicks: number; total_orders: number; total_revenue: number
        }> }
        if (!active) return
        setLinks((data.links ?? []).map(l => ({
          id: l.id,
          affiliateCode: l.affiliate_code,
          affiliateName: l.affiliate_name ?? '',
          commissionPct: l.commission_pct,
          enabled: l.enabled,
          totalClicks: l.total_clicks,
          totalOrders: l.total_orders,
          totalRevenue: l.total_revenue,
        })))
      } catch {
        // Supabase not available
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [product.slug])

  async function handleAdd() {
    if (!affiliateName.trim()) {
      toast.error('Affiliate name is required.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/v5/affiliate-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: product.slug,
          affiliateName: affiliateName.trim(),
          affiliateEmail: affiliateEmail.trim() || undefined,
          commissionPct: parseFloat(commissionPct) || 0,
        }),
      })
      const data = (await res.json()) as { link?: { id: string; affiliate_code?: string; affiliateCode?: string; affiliate_name?: string | null; affiliateName?: string; commission_pct?: number; commissionPct?: number; enabled?: boolean; total_clicks?: number; totalClicks?: number; total_orders?: number; totalOrders?: number; total_revenue?: number; totalRevenue?: number }; persisted?: boolean }
      const raw = data.link
      if (raw) {
        setLinks(prev => [...prev, {
          id: raw.id,
          affiliateCode: raw.affiliate_code ?? raw.affiliateCode ?? '',
          affiliateName: raw.affiliate_name ?? raw.affiliateName ?? affiliateName.trim(),
          commissionPct: raw.commission_pct ?? raw.commissionPct ?? 0,
          enabled: raw.enabled ?? true,
          totalClicks: raw.total_clicks ?? raw.totalClicks ?? 0,
          totalOrders: raw.total_orders ?? raw.totalOrders ?? 0,
          totalRevenue: raw.total_revenue ?? raw.totalRevenue ?? 0,
        }])
      }
      setAffiliateName(''); setAffiliateEmail(''); setCommissionPct('30')
      setAdding(false)
      toast.success(data.persisted ? 'Affiliate link saved to Supabase!' : 'Affiliate link created!')
    } catch {
      toast.error('Could not create affiliate link. Try again.')
    } finally {
      setSaving(false)
    }
  }

  function getAffUrl(code: string) {
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${product.slug}?aff=${code}`
  }

  function copyLink(code: string) {
    void navigator.clipboard.writeText(getAffUrl(code))
    toast.success('Affiliate link copied!')
  }

  return (
    <div className="space-y-4 mt-8 pt-6 border-t border-neutral-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-black">Affiliate Links</p>
          <p className="text-xs text-neutral-500 mt-0.5">
            Generate referral codes. Track clicks and orders.
          </p>
        </div>
        {!adding && !loading && (
          <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
            <Plus size={13} /> New Affiliate
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-4 text-sm text-neutral-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
          Loading affiliate links…
        </div>
      )}

      {adding && (
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Affiliate Name *" value={affiliateName} onChange={e => setAffiliateName(e.target.value)} placeholder="e.g. John Smith" />
              <Input label="Affiliate Email" value={affiliateEmail} onChange={e => setAffiliateEmail(e.target.value)} placeholder="john@example.com" type="email" />
            </div>
            <Input label="Commission %" type="number" value={commissionPct} onChange={e => setCommissionPct(e.target.value)} hint="% of sale price (payouts handled manually)" />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} loading={saving}>Create Link</Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {links.length === 0 && !adding && !loading ? (
        <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-center">
          <p className="text-sm text-neutral-500">No affiliate links yet. Create one to start tracking referrals.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <div key={link.id} className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-black">{link.affiliateName}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    Code: <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded">{link.affiliateCode}</code>
                    {' · '}{link.commissionPct}% commission
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-center">
                    <p className="text-xs font-bold text-black">{link.totalClicks}</p>
                    <p className="text-[10px] text-neutral-400">clicks</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-black">{link.totalOrders}</p>
                    <p className="text-[10px] text-neutral-400">orders</p>
                  </div>
                  <Button size="xs" variant="secondary" onClick={() => copyLink(link.affiliateCode)}>
                    Copy Link
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

function ProductHubForm({ params }: { params: Promise<{ id: string }> }) {
  const searchParams = useSearchParams()
  const fromEditor = searchParams.get('from') === 'store-editor'
  const [product, setProduct] = useState<Product | null>(null)
  const [tab, setTab] = useState<HubTab>('overview')
  const [contentSub, setContentSub] = useState<ContentSub>('edit')
  const [customersSub, setCustomersSub] = useState<CustomersSub>('customers')
  const [growthSub, setGrowthSub] = useState<GrowthSub>('coupons')

  useEffect(() => {
    params.then(({ id }) => {
      demoProductRepo.findById(id).then(p => {
        if (!p) return
        setProduct(p)
      })
    })
  }, [params])

  if (!product) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-neutral-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent mr-2" />
        Loading…
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      {/* Back link */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={fromEditor ? '/dashboard/store-editor' : '/dashboard/products'}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-black transition-colors"
        >
          <ArrowLeft size={14} />
          {fromEditor ? 'Back to Store Editor' : 'Back to Products'}
        </Link>
        {product.status === 'published' && (
          <Link href={`/p/${product.slug}`} target="_blank">
            <Button variant="secondary" size="sm">
              <ExternalLink size={13} /> View Page
            </Button>
          </Link>
        )}
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-black">{product.name}</h1>
          <Badge variant={product.status === 'published' ? 'success' : 'warning'}>
            {product.status === 'published' ? 'Live' : product.status}
          </Badge>
        </div>
        <p className="text-sm text-neutral-500">
          Product Hub · {formatCurrency(product.price)} · {product.salesCount} sales
        </p>
      </div>

      {/* Primary tab navigation */}
      <TabBar tab={tab} onChange={setTab} />

      {/* Tab content */}
      <div className="mt-6">
        {/* ── Overview ─────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-8">
            <OverviewTab product={product} onTabChange={setTab} />
            <AnalyticsTab product={product} />
          </div>
        )}

        {/* ── Content: Edit | Files | Updates ──────────────────── */}
        {tab === 'content' && (
          <div>
            <SubTabBar
              items={[
                { key: 'edit' as ContentSub, label: 'Edit' },
                { key: 'files' as ContentSub, label: 'Files' },
                { key: 'updates' as ContentSub, label: 'Updates' },
              ]}
              active={contentSub}
              onChange={setContentSub}
            />
            {contentSub === 'edit' && (
              <EditTab
                product={product}
                fromEditor={fromEditor}
                onSaved={() => {
                  demoProductRepo.findById(product.id).then(p => { if (p) setProduct(p) })
                }}
                onDeleted={() => {}}
              />
            )}
            {contentSub === 'files' && <FilesTab productSlug={product.slug} />}
            {contentSub === 'updates' && <UpdatesTab productSlug={product.slug} />}
          </div>
        )}

        {/* ── Customers: Customers | Reviews ────────────────────── */}
        {tab === 'customers' && (
          <div>
            <SubTabBar
              items={[
                { key: 'customers' as CustomersSub, label: 'Customers' },
                { key: 'reviews' as CustomersSub, label: 'Reviews' },
              ]}
              active={customersSub}
              onChange={setCustomersSub}
            />
            {customersSub === 'customers' && <CustomersTab product={product} />}
            {customersSub === 'reviews' && <ReviewsTab productSlug={product.slug} />}
          </div>
        )}

        {/* ── Growth: Coupons | Affiliates ──────────────────────── */}
        {tab === 'growth' && (
          <div>
            <SubTabBar
              items={[
                { key: 'coupons' as GrowthSub, label: 'Coupons' },
                { key: 'affiliates' as GrowthSub, label: 'Affiliates' },
              ]}
              active={growthSub}
              onChange={setGrowthSub}
            />
            {growthSub === 'coupons' && <CouponsTab />}
            {growthSub === 'affiliates' && <AffiliateSection product={product} />}
          </div>
        )}

        {/* ── Settings ─────────────────────────────────────────── */}
        {tab === 'settings' && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Product URL</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5">
                  <Link2 size={13} className="text-neutral-400 shrink-0" />
                  <code className="flex-1 text-xs text-neutral-600 truncate">/p/{product.slug}</code>
                  <Link href={`/p/${product.slug}`} target="_blank">
                    <Button size="xs" variant="ghost"><ExternalLink size={11} /> View</Button>
                  </Link>
                </div>
                <p className="text-xs text-neutral-500">
                  Change the slug in the <button onClick={() => { setTab('content'); setContentSub('edit') }} className="underline hover:text-black">Edit tab</button>.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Visibility & Status</CardTitle></CardHeader>
              <CardContent className="divide-y divide-neutral-50">
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">Status</p>
                    <p className="text-xs text-neutral-500">{product.status === 'published' ? 'Live — visible to buyers' : 'Draft — not publicly visible'}</p>
                  </div>
                  <Badge variant={product.status === 'published' ? 'success' : 'neutral'}>
                    {product.status === 'published' ? 'Live' : 'Draft'}
                  </Badge>
                </div>
                <div className="py-3">
                  <p className="text-xs text-neutral-500">
                    Change published status in the <button onClick={() => { setTab('content'); setContentSub('edit') }} className="underline hover:text-black">Edit tab</button>.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Marketplace</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-500">
                  Marketplace visibility and badges can be configured in the{' '}
                  <button onClick={() => { setTab('content'); setContentSub('edit') }} className="underline hover:text-black">Edit tab</button>.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProductHubPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-16 text-sm text-neutral-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent mr-2" />
        Loading…
      </div>
    }>
      <ProductHubForm params={params} />
    </Suspense>
  )
}
