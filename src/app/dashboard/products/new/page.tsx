'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, X, Store, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { slugify, formatCurrency } from '@/lib/utils'
import { uploadFile, buildStoragePath } from '@/lib/supabase/storage'
import { useAuth } from '@/context/auth-context'
import { MAX_PRODUCT_FILE_SIZE_BYTES, MAX_COVER_IMAGE_SIZE_BYTES } from '@/lib/platform-config'
import {
  CoverImageCreationHeaderLink,
  CoverImageCreationHelperText,
  ProductFileCreationHeaderLinks,
  ProductFileCreationHelperText,
} from '@/components/dashboard/product-creation-shortcuts'
import { ProductPricingSection } from '@/components/dashboard/product-pricing-section'
import { DropUploadZone } from '@/components/dashboard/drop-upload-zone'
import { ProductFileRow } from '@/components/dashboard/product-file-row'
import { datetimeLocalToIso, validateSalePricingForSave } from '@/lib/pricing/product-price'
import { PRODUCT_CATEGORIES } from '@/lib/product-categories'

const COMMISSION_PRESETS = [10, 20, 30, 40, 50]

export default function NewProductPage() {
  const router = useRouter()
  const { session } = useAuth()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [priceDollars, setPriceDollars] = useState('')
  const [isFree, setIsFree] = useState(false)
  const [saleEnabled, setSaleEnabled] = useState(false)
  const [salePriceDollars, setSalePriceDollars] = useState('')
  const [saleEndsAt, setSaleEndsAt] = useState('')
  const [category, setCategory] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [coverUploading, setCoverUploading] = useState(false)
  const [productFile, setProductFile] = useState<{ name: string; path: string; size: number; type: string } | null>(null)
  const [fileUploading, setFileUploading] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [marketplaceListing, setMarketplaceListing] = useState(true)
  const [affiliateEnabled, setAffiliateEnabled] = useState(true)
  const [affiliateCommission, setAffiliateCommission] = useState(30)
  const [customCommission, setCustomCommission] = useState('')
  const [saving, setSaving] = useState(false)

  const priceCentsPreview = isFree ? 0 : Math.round(parseFloat(priceDollars || '0') * 100)
  const commPercent = affiliateEnabled ? (customCommission ? parseInt(customCommission) || 0 : affiliateCommission) : 0
  const commCents = Math.floor(priceCentsPreview * (commPercent / 100))

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!slug || slug === slugify(title)) {
      setSlug(slugify(val))
    }
  }

  async function uploadCoverFile(file: File) {
    if (file.size > MAX_COVER_IMAGE_SIZE_BYTES) {
      toast.error('Cover image must be under 5 MB.')
      return
    }
    setCoverUploading(true)
    const path = buildStoragePath(session?.userId ?? 'unknown', file.name)
    const result = await uploadFile('product-images', path, file)
    if (result.error) {
      toast.error('Upload failed: ' + result.error)
    } else if (result.url) {
      setCoverImageUrl(result.url)
      toast.success('Cover image uploaded.')
    }
    setCoverUploading(false)
  }

  async function uploadProductFile(file: File) {
    if (file.size > MAX_PRODUCT_FILE_SIZE_BYTES) {
      toast.error('File must be under 100 MB.')
      return
    }
    setFileUploading(true)
    const path = buildStoragePath(session?.userId ?? 'unknown', file.name)
    const result = await uploadFile('product-files', path, file)
    if (result.error) {
      toast.error('Upload failed: ' + result.error)
    } else if (result.path) {
      setProductFile({ name: file.name, path: result.path, size: file.size, type: file.type })
      toast.success('File uploaded.')
    }
    setFileUploading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return toast.error('Product title is required.')
    if (!slug.trim()) return toast.error('Product URL slug is required.')

    const priceCents = isFree ? 0 : Math.round(parseFloat(priceDollars || '0') * 100)
    if (!isFree && (isNaN(priceCents) || priceCents < 50)) {
      return toast.error('Price must be at least $0.50 for paid products.')
    }

    const salePriceCents =
      !isFree && saleEnabled && salePriceDollars.trim()
        ? Math.round(parseFloat(salePriceDollars) * 100)
        : null
    const saleError = validateSalePricingForSave({
      price_cents: priceCents,
      sale_enabled: !isFree && saleEnabled,
      sale_price_cents: salePriceCents,
    })
    if (saleError) return toast.error(saleError)

    setSaving(true)
    const finalCommPercent = affiliateEnabled
      ? (customCommission ? parseInt(customCommission) || 0 : affiliateCommission)
      : null
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          price_cents: priceCents,
          sale_enabled: !isFree && saleEnabled,
          sale_price_cents: salePriceCents,
          sale_ends_at: !isFree && saleEnabled ? datetimeLocalToIso(saleEndsAt) : null,
          cover_image_url: coverImageUrl,
          is_live: isLive,
          category: category || null,
          marketplace_listing: marketplaceListing,
          affiliate_enabled: affiliateEnabled,
          affiliate_commission_percent: finalCommPercent,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create product.')

      const productId = data.product.id

      // Register the uploaded file if one was uploaded
      if (productFile) {
        await fetch(`/api/products/${productId}/files`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_name: productFile.name,
            file_type: productFile.type,
            file_size: productFile.size,
            storage_path: productFile.path,
          }),
        })
      }

      toast.success('Product created!')
      router.push(`/dashboard/products/${productId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create product.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-black transition-colors mb-4"
        >
          <ArrowLeft size={14} /> Products
        </Link>
        <h1 className="text-2xl font-bold text-black">Create Product</h1>
        <p className="text-sm text-neutral-500 mt-1">Upload your file, set a price, and publish.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Product Name */}
        <Card>
          <CardHeader><CardTitle>Product Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Product Name *"
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="e.g. Airbnb Investment Calculator"
              required
            />
            <Textarea
              label="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What does your product include? Who is it for?"
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Cover Image */}
        <Card>
          <CardHeader>
            <CardTitle>Cover Image</CardTitle>
            <CoverImageCreationHeaderLink />
          </CardHeader>
          <CardContent>
            {coverImageUrl ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setCoverImageUrl(null)}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <DropUploadZone
                onFile={uploadCoverFile}
                accept="image/*"
                disabled={coverUploading}
                className="flex flex-col items-center justify-center w-full aspect-video"
              >
                {coverUploading ? (
                  <div className="w-5 h-5 border-2 border-neutral-400 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload size={24} className="text-neutral-400 mb-2" />
                    <p className="text-sm font-medium text-neutral-600">Drop or click to upload cover image</p>
                    <p className="text-xs text-neutral-400 mt-1">JPG, PNG, WebP · Max 5 MB</p>
                  </>
                )}
              </DropUploadZone>
            )}
            <CoverImageCreationHelperText />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
          <CardContent>
            <ProductPricingSection
              isFree={isFree}
              onIsFreeChange={setIsFree}
              priceDollars={priceDollars}
              onPriceDollarsChange={setPriceDollars}
              saleEnabled={saleEnabled}
              onSaleEnabledChange={setSaleEnabled}
              salePriceDollars={salePriceDollars}
              onSalePriceDollarsChange={setSalePriceDollars}
              saleEndsAt={saleEndsAt}
              onSaleEndsAtChange={setSaleEndsAt}
            />
          </CardContent>
        </Card>

        {/* Digital File */}
        <Card>
          <CardHeader>
            <CardTitle>Digital File</CardTitle>
            <ProductFileCreationHeaderLinks />
          </CardHeader>
          <CardContent>
            {productFile ? (
              <ProductFileRow
                fileName={productFile.name}
                fileSize={productFile.size}
                fileType={productFile.type}
                storagePath={productFile.path}
                onRemove={() => setProductFile(null)}
              />
            ) : (
              <DropUploadZone
                onFile={uploadProductFile}
                disabled={fileUploading}
                className="flex flex-col items-center justify-center w-full py-10"
              >
                {fileUploading ? (
                  <div className="w-5 h-5 border-2 border-neutral-400 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload size={24} className="text-neutral-400 mb-2" />
                    <p className="text-sm font-medium text-neutral-600">Drop or click to upload product file</p>
                    <p className="text-xs text-neutral-400 mt-1">PDF, ZIP, XLSX, DOCX, images and more · Max 100 MB</p>
                  </>
                )}
              </DropUploadZone>
            )}
            <ProductFileCreationHelperText />
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
                placeholder="my-product-name"
              />
            </div>
            <p className="text-xs text-neutral-400 mt-1.5">
              Your product will be available at sellbop.com/p/{slug || 'your-product-name'}
            </p>
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
              {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
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
          <CardContent className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer select-none">
              <div>
                <p className="text-sm font-medium text-neutral-800">List in Sellbop Marketplace</p>
                <p className="text-xs text-neutral-500 mt-0.5">Let people discover this product while browsing Sellbop.</p>
              </div>
              <button
                type="button"
                onClick={() => setMarketplaceListing(v => !v)}
                className={`relative flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${marketplaceListing ? 'bg-black' : 'bg-neutral-200'}`}
              >
                <span className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${marketplaceListing ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
              </button>
            </label>
          </CardContent>
        </Card>

        {/* Sellbop Share */}
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
                className={`relative flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${affiliateEnabled ? 'bg-emerald-500' : 'bg-neutral-200'}`}
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
                    Affiliate commissions only apply to paid products. Free products cannot have commission.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Publish */}
        <Card>
          <CardHeader><CardTitle>Visibility</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isLive}
                  onChange={e => setIsLive(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300"
                />
                <span className="text-sm font-medium text-neutral-700">Publish immediately</span>
              </label>
            </div>
            <p className="text-xs text-neutral-400 mt-2">
              {isLive ? 'Product will be publicly visible after saving.' : 'Product will be saved as a draft.'}
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3 pb-8">
          <Button type="submit" loading={saving} disabled={fileUploading || coverUploading}>
            {isLive ? 'Publish Product' : 'Save Draft'}
          </Button>
          <Link href="/dashboard/products">
            <Button type="button" variant="secondary">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
