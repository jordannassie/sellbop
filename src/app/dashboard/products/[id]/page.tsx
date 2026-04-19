'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { demoProductRepo } from '@/lib/adapters/demo/repositories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Toggle } from '@/components/ui/toggle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { slugify, formatCurrency } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'
import type { Product, ProductType } from '@/lib/domain/entities'
import Link from 'next/link'

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

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [productType, setProductType] = useState<ProductType>('digital_download')
  const [price, setPrice] = useState('')
  const [compareAtPrice, setCompareAtPrice] = useState('')
  const [ctaText, setCtaText] = useState('Get Instant Access')
  const [externalUrl, setExternalUrl] = useState('')
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    params.then(({ id }) => {
      demoProductRepo.findById(id).then(p => {
        if (!p) return
        setProduct(p)
        setName(p.name); setSlug(p.slug); setDescription(p.description)
        setShortDescription(p.shortDescription ?? '')
        setProductType(p.productType); setPrice(String(p.price / 100))
        setCompareAtPrice(p.compareAtPrice ? String(p.compareAtPrice / 100) : '')
        setCtaText(p.ctaText); setExternalUrl(p.externalUrl ?? '')
        setPublished(p.status === 'published')
      })
    })
  }, [params])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!product) return
    setSaving(true)
    try {
      await demoProductRepo.update(product.id, {
        name, slug, description, shortDescription: shortDescription || null,
        productType, status: published ? 'published' : 'draft',
        price: Math.round(parseFloat(price) * 100),
        compareAtPrice: compareAtPrice ? Math.round(parseFloat(compareAtPrice) * 100) : null,
        ctaText, externalUrl: externalUrl || null,
        publishedAt: published ? (product.publishedAt || new Date().toISOString()) : null,
      })
      toast.success('Product updated.')
      router.push('/dashboard/products')
    } catch { toast.error('Failed to update product.') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!product || !confirm('Delete this product?')) return
    setDeleting(true)
    await demoProductRepo.delete(product.id)
    toast.success('Product deleted.')
    router.push('/dashboard/products')
  }

  if (!product) return <div className="text-sm text-neutral-500 py-8">Loading…</div>

  return (
    <div className="max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Edit Product</h1>
          <p className="text-neutral-500 text-sm mt-1">{product.name}</p>
        </div>
        {product.status === 'published' && (
          <Link href={`/p/${product.slug}`} target="_blank">
            <Button variant="secondary" size="sm"><ExternalLink size={13} />View Page</Button>
          </Link>
        )}
      </div>
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
                <p className="text-xs text-neutral-500 mt-0.5">{published ? 'Live at /p/' + slug : 'Draft — not publicly visible'}</p>
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
    </div>
  )
}
