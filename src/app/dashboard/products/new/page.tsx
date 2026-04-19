'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { demoProductRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Toggle } from '@/components/ui/toggle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { slugify } from '@/lib/utils'
import type { ProductType } from '@/lib/domain/entities'

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

export default function NewProductPage() {
  const router = useRouter()
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

  function handleNameChange(val: string) {
    setName(val)
    setSlug(slugify(val))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !slug || !price) return toast.error('Please fill in all required fields.')
    const priceAmount = Math.round(parseFloat(price) * 100)
    if (isNaN(priceAmount) || priceAmount < 50) return toast.error('Price must be at least $0.50.')
    setSaving(true)
    try {
      await demoProductRepo.create({
        sellerId: DEMO_SELLER_PROFILE.id,
        name, slug, description, shortDescription: shortDescription || null,
        productType, status: published ? 'published' : 'draft',
        price: priceAmount,
        compareAtPrice: compareAtPrice ? Math.round(parseFloat(compareAtPrice) * 100) : null,
        currency: 'usd',
        thumbnailUrl: null, coverImageUrl: null, galleryImageUrls: [],
        category: null, tags: [], fileAssetIds: [],
        externalUrl: externalUrl || null,
        confirmationMessage: null, supportEmail: DEMO_SELLER_PROFILE.supportEmail,
        ctaText, seoTitle: null, seoDescription: null,
        licenseKeyEnabled: false, memberAccessEnabled: false,
        downloadLimit: null, accessExpirationDays: null, variants: [],
        publishedAt: published ? new Date().toISOString() : null,
      })
      toast.success('Product created!')
      router.push('/dashboard/products')
    } catch { toast.error('Failed to create product.') }
    finally { setSaving(false) }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-black">New Product</h1>
        <p className="text-neutral-500 text-sm mt-1">Create your sell page.</p>
      </div>
      <form onSubmit={handleSave} className="space-y-5">
        <Card>
          <CardHeader><CardTitle>Basics</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Product Name *" value={name} onChange={e => handleNameChange(e.target.value)} placeholder="Notion Template Pack" required />
            <Input label="Slug *" value={slug} onChange={e => setSlug(slugify(e.target.value))} placeholder="notion-template-pack" hint={`Public URL: /p/${slug || 'your-slug'}`} required />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Product Type" value={productType} onChange={e => setProductType(e.target.value as ProductType)} options={TYPES} />
              <Select label="CTA Button" value={ctaText} onChange={e => setCtaText(e.target.value)} options={CTA_OPTIONS} />
            </div>
            <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what buyers get..." rows={4} />
            <Input label="Short Description" value={shortDescription} onChange={e => setShortDescription(e.target.value)} placeholder="One-line summary shown in listings" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Price (USD) *" type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="29" min="0.50" step="0.01" required />
              <Input label="Compare-at Price" type="number" value={compareAtPrice} onChange={e => setCompareAtPrice(e.target.value)} placeholder="49" step="0.01" hint="Shows as strikethrough" />
            </div>
          </CardContent>
        </Card>

        {(productType === 'service_offer' || productType === 'subscription') && (
          <Card>
            <CardHeader><CardTitle>Fulfillment</CardTitle></CardHeader>
            <CardContent>
              <Input label="Booking / Access Link" type="url" value={externalUrl} onChange={e => setExternalUrl(e.target.value)} placeholder="https://cal.com/yourname" hint="Shown to buyer after purchase" />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-900">Publish Page</p>
                <p className="text-xs text-neutral-500 mt-0.5">Make this product publicly visible.</p>
              </div>
              <Toggle checked={published} onChange={setPublished} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={saving}>{published ? 'Publish Product' : 'Save as Draft'}</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
