'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { demoProductRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { slugify } from '@/lib/utils'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
  Wand2,
} from 'lucide-react'
import Link from 'next/link'
import type { ProductType } from '@/lib/domain/entities'

// ── Types ─────────────────────────────────────────────────────────────────────

interface BuilderInput {
  whatAreYouSelling: string
  whoIsItFor: string
  productType: string
  priceRange: string
  toneStyle: string
  whatsIncluded: string
}

interface BuilderOutput {
  productName: string
  slugSuggestion: string
  shortDescription: string
  fullDescription: string
  productType: string
  priceSuggestion: number
  compareAtPriceSuggestion: number | null
  ctaText: string
  whatIsIncluded: string[]
  faq: { question: string; answer: string }[]
  checkoutCopy: string
  socialPost: string
  marketplaceExcerpt: string
  imagePrompt: string
  bannerPrompt: string
}

// ── Options ───────────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: 'digital_download', label: 'Digital Download (PDF, template, course)' },
  { value: 'service_offer', label: 'Service / Coaching' },
  { value: 'subscription', label: 'Membership / Subscription' },
  { value: 'bundle', label: 'Bundle (multiple products)' },
]

const PRICE_OPTIONS = [
  { value: '$5-$20', label: '$5–$20 (low ticket)' },
  { value: '$20-$50', label: '$20–$50 (entry level)' },
  { value: '$50-$100', label: '$50–$100 (mid tier)' },
  { value: '$100-$300', label: '$100–$300 (premium)' },
  { value: '$300-$1000', label: '$300–$1,000 (high ticket)' },
  { value: '$1000+', label: '$1,000+ (VIP / enterprise)' },
]

const TONE_OPTIONS = [
  { value: 'professional, clear, friendly', label: 'Professional & Friendly' },
  { value: 'bold, direct, energetic', label: 'Bold & Direct' },
  { value: 'warm, conversational, personal', label: 'Warm & Conversational' },
  { value: 'premium, exclusive, sophisticated', label: 'Premium & Sophisticated' },
  { value: 'casual, playful, relatable', label: 'Casual & Playful' },
  { value: 'educational, authoritative, detailed', label: 'Educational & Authoritative' },
]

// ── Step 1: Input Form ────────────────────────────────────────────────────────

function BuilderForm({
  onGenerate,
}: {
  onGenerate: (input: BuilderInput, result: BuilderOutput) => void
}) {
  const [whatAreYouSelling, setWhatAreYouSelling] = useState('')
  const [whoIsItFor, setWhoIsItFor] = useState('')
  const [productType, setProductType] = useState('digital_download')
  const [priceRange, setPriceRange] = useState('$20-$50')
  const [toneStyle, setToneStyle] = useState('professional, clear, friendly')
  const [whatsIncluded, setWhatsIncluded] = useState('')
  const [generating, setGenerating] = useState(false)

  async function handleGenerate() {
    if (!whatAreYouSelling.trim() || !whoIsItFor.trim()) {
      toast.error('Please fill in what you are selling and who it is for.')
      return
    }

    setGenerating(true)

    const input: BuilderInput = {
      whatAreYouSelling: whatAreYouSelling.trim(),
      whoIsItFor: whoIsItFor.trim(),
      productType,
      priceRange,
      toneStyle,
      whatsIncluded: whatsIncluded.trim(),
    }

    try {
      const res = await fetch('/api/ai/product-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!res.ok) {
        const err = (await res.json()) as { error?: string }
        throw new Error(err.error ?? 'Generation failed')
      }

      const result = (await res.json()) as BuilderOutput
      toast.success('Product copy generated!')
      onGenerate(input, result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tell us about your product</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Textarea
            label="What are you selling? *"
            value={whatAreYouSelling}
            onChange={e => setWhatAreYouSelling(e.target.value)}
            rows={2}
            placeholder="e.g. A Notion template system for freelancers to track clients and invoices"
          />
          <Textarea
            label="Who is it for? *"
            value={whoIsItFor}
            onChange={e => setWhoIsItFor(e.target.value)}
            rows={2}
            placeholder="e.g. Freelance designers and developers who want to stay organized without complex tools"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Product Type"
              value={productType}
              onChange={e => setProductType(e.target.value)}
              options={TYPE_OPTIONS}
            />
            <Select
              label="Price Range"
              value={priceRange}
              onChange={e => setPriceRange(e.target.value)}
              options={PRICE_OPTIONS}
            />
          </div>
          <Select
            label="Tone & Style"
            value={toneStyle}
            onChange={e => setToneStyle(e.target.value)}
            options={TONE_OPTIONS}
          />
          <Textarea
            label="What is included? (optional)"
            value={whatsIncluded}
            onChange={e => setWhatsIncluded(e.target.value)}
            rows={3}
            placeholder="e.g. 15 Notion templates, video walkthrough, client onboarding checklist, invoice tracker"
          />
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button
          onClick={handleGenerate}
          loading={generating}
          disabled={!whatAreYouSelling.trim() || !whoIsItFor.trim()}
          className="w-full sm:w-auto"
        >
          <Sparkles size={14} />
          {generating ? 'Generating…' : 'Generate Product Copy'}
        </Button>
        <p className="text-xs text-neutral-400">
          {generating ? 'This takes 5–15 seconds…' : 'AI will generate copy, pricing, FAQ, and more.'}
        </p>
      </div>
    </div>
  )
}

// ── Step 2: Preview & Edit ────────────────────────────────────────────────────

function BuilderPreview({
  result: initialResult,
  onCreateProduct,
}: {
  result: BuilderOutput
  onCreateProduct: (r: BuilderOutput) => Promise<void>
}) {
  const [result, setResult] = useState<BuilderOutput>(initialResult)
  const [creating, setCreating] = useState(false)

  function update<K extends keyof BuilderOutput>(key: K, value: BuilderOutput[K]) {
    setResult(prev => ({ ...prev, [key]: value }))
  }

  function updateFaq(index: number, field: 'question' | 'answer', value: string) {
    setResult(prev => ({
      ...prev,
      faq: prev.faq.map((f, i) => i === index ? { ...f, [field]: value } : f),
    }))
  }

  function updateIncluded(index: number, value: string) {
    setResult(prev => ({
      ...prev,
      whatIsIncluded: prev.whatIsIncluded.map((item, i) => i === index ? value : item),
    }))
  }

  async function handleCreate() {
    setCreating(true)
    try {
      await onCreateProduct(result)
    } finally {
      setCreating(false)
    }
  }

  const priceDollars = (result.priceSuggestion / 100).toFixed(2)
  const compareDollars = result.compareAtPriceSuggestion
    ? (result.compareAtPriceSuggestion / 100).toFixed(2)
    : ''

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <CheckCircle2 size={16} className="flex-shrink-0 text-emerald-600" />
        <p className="text-sm text-emerald-700">
          AI generated your product copy. Review and edit below, then create your product.
        </p>
      </div>

      {/* Editable fields */}
      <Card>
        <CardHeader><CardTitle>Product Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Product Name"
            value={result.productName}
            onChange={e => {
              update('productName', e.target.value)
              update('slugSuggestion', slugify(e.target.value))
            }}
          />
          <Input
            label="URL Slug"
            value={result.slugSuggestion}
            onChange={e => update('slugSuggestion', slugify(e.target.value))}
            hint={`/p/${result.slugSuggestion}`}
          />
          <Input
            label="Short Description"
            value={result.shortDescription}
            onChange={e => update('shortDescription', e.target.value)}
          />
          <Textarea
            label="Full Description"
            value={result.fullDescription}
            onChange={e => update('fullDescription', e.target.value)}
            rows={6}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pricing & CTA</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Price (USD)"
              type="number"
              value={priceDollars}
              onChange={e => update('priceSuggestion', Math.round(parseFloat(e.target.value) * 100))}
              step="0.01"
            />
            <Input
              label="Compare-at Price"
              type="number"
              value={compareDollars}
              onChange={e =>
                update('compareAtPriceSuggestion', e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null)
              }
              step="0.01"
              hint="Optional strikethrough"
            />
            <Input
              label="CTA Button Text"
              value={result.ctaText}
              onChange={e => update('ctaText', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>What&apos;s Included</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {result.whatIsIncluded.map((item, i) => (
            <Input
              key={i}
              label={`Item ${i + 1}`}
              value={item}
              onChange={e => updateIncluded(i, e.target.value)}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>FAQ</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {result.faq.map((faq, i) => (
            <div key={i} className="space-y-2 pb-3 border-b border-neutral-50 last:border-0 last:pb-0">
              <Input
                label={`Question ${i + 1}`}
                value={faq.question}
                onChange={e => updateFaq(i, 'question', e.target.value)}
              />
              <Textarea
                label="Answer"
                value={faq.answer}
                onChange={e => updateFaq(i, 'answer', e.target.value)}
                rows={2}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Marketing Copy</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Checkout Copy"
            value={result.checkoutCopy}
            onChange={e => update('checkoutCopy', e.target.value)}
            hint="Shown at checkout to reassure buyers"
          />
          <Textarea
            label="Social Post"
            value={result.socialPost}
            onChange={e => update('socialPost', e.target.value)}
            rows={3}
            hint="Ready-to-post launch caption"
          />
          <Input
            label="Marketplace Excerpt"
            value={result.marketplaceExcerpt}
            onChange={e => update('marketplaceExcerpt', e.target.value)}
            hint="Shown on marketplace cards (max 120 chars)"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Image Prompts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
            Image generation coming soon. Copy these prompts to use with DALL-E or Midjourney.
          </div>
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-xs font-medium text-neutral-600">Product Image Prompt</p>
              <div className="rounded-lg border border-neutral-200 bg-white p-3 font-mono text-xs text-neutral-700 leading-relaxed">
                {result.imagePrompt}
              </div>
              <div className="mt-2 flex gap-2">
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => { void navigator.clipboard.writeText(result.imagePrompt); toast.success('Copied!') }}
                >
                  Copy Prompt
                </Button>
                <Button size="xs" variant="ghost" disabled>
                  <ImageIcon size={11} /> Generate Image (coming soon)
                </Button>
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-neutral-600">Store Banner Prompt</p>
              <div className="rounded-lg border border-neutral-200 bg-white p-3 font-mono text-xs text-neutral-700 leading-relaxed">
                {result.bannerPrompt}
              </div>
              <div className="mt-2 flex gap-2">
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => { void navigator.clipboard.writeText(result.bannerPrompt); toast.success('Copied!') }}
                >
                  Copy Prompt
                </Button>
                <Button size="xs" variant="ghost" disabled>
                  <ImageIcon size={11} /> Generate Banner (coming soon)
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t border-neutral-100">
        <Button onClick={handleCreate} loading={creating} className="w-full sm:w-auto">
          <ArrowRight size={14} /> Create Product
        </Button>
        <p className="text-xs text-neutral-400">
          This will create a draft product with the generated content.
        </p>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AIBuilderPage() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'preview'>('form')
  const [result, setResult] = useState<BuilderOutput | null>(null)

  function handleGenerate(_input: BuilderInput, output: BuilderOutput) {
    setResult(output)
    setStep('preview')
  }

  async function handleCreateProduct(r: BuilderOutput) {
    try {
      const newProduct = await demoProductRepo.create({
        sellerId: DEMO_SELLER_PROFILE.id,
        name: r.productName,
        slug: r.slugSuggestion || slugify(r.productName),
        description: r.fullDescription,
        shortDescription: r.shortDescription,
        productType: (r.productType as ProductType) || 'digital_download',
        status: 'draft',
        price: r.priceSuggestion,
        compareAtPrice: r.compareAtPriceSuggestion,
        currency: 'usd',
        thumbnailUrl: null,
        coverImageUrl: null,
        galleryImageUrls: [],
        category: null,
        tags: [],
        fileAssetIds: [],
        externalUrl: null,
        confirmationMessage: null,
        supportEmail: null,
        ctaText: r.ctaText,
        seoTitle: r.productName,
        seoDescription: r.shortDescription,
        licenseKeyEnabled: false,
        memberAccessEnabled: false,
        downloadLimit: null,
        accessExpirationDays: null,
        variants: [],
        publishedAt: null,
        marketplaceVisible: true,
        marketplaceExcerpt: r.marketplaceExcerpt,
      })

      toast.success('Product created! Redirecting to Product Hub…')
      router.push(`/dashboard/products/${newProduct.id}`)
    } catch (err) {
      toast.error('Failed to create product. Please try again.')
      console.error(err)
    }
  }

  return (
    <div className="w-full max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-black transition-colors mb-4"
        >
          <ArrowLeft size={14} /> Back to Products
        </Link>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black">
            <Wand2 size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-black">AI Product Builder</h1>
            <p className="text-sm text-neutral-500">
              Describe your product — AI writes the copy, pricing, FAQ, and more.
            </p>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2">
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${step === 'form' ? 'text-black' : 'text-neutral-400'}`}>
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${step === 'form' ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-500'}`}>
            1
          </span>
          <span className="whitespace-nowrap">Describe Product</span>
        </div>
        <div className="h-px flex-1 max-w-[32px] bg-neutral-200" />
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${step === 'preview' ? 'text-black' : 'text-neutral-400'}`}>
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${step === 'preview' ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-500'}`}>
            2
          </span>
          <span className="whitespace-nowrap">Review &amp; Create</span>
        </div>
      </div>

      {step === 'form' && (
        <BuilderForm onGenerate={handleGenerate} />
      )}

      {step === 'preview' && result && (
        <div>
          <button
            onClick={() => setStep('form')}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-black transition-colors"
          >
            <ArrowLeft size={13} /> Back to form
          </button>
          <BuilderPreview
            result={result}
            onCreateProduct={handleCreateProduct}
          />
        </div>
      )}
    </div>
  )
}
