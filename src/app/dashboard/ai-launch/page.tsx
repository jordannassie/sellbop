'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { demoProductRepo, demoStorefrontRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { slugify } from '@/lib/utils'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Wand2,
  Store,
  Package,
  ClipboardList,
} from 'lucide-react'
import type { StoreLaunchOutput } from '@/app/api/ai/store-launch/route'
import type { ProductType } from '@/lib/domain/entities'
import { cn } from '@/lib/utils'

// ── Step types ────────────────────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3 | 4 | 5

interface WizardData {
  whatYouSell: string
  whoIsItFor: string
  whatsIncluded: string
  priceRange: string
}

// ── Price options ─────────────────────────────────────────────────────────────

const PRICE_OPTIONS = [
  { value: '$5-$20', label: '$5–$20', sub: 'Low ticket' },
  { value: '$20-$50', label: '$20–$50', sub: 'Entry level' },
  { value: '$50-$100', label: '$50–$100', sub: 'Mid tier' },
  { value: '$100-$300', label: '$100–$300', sub: 'Premium' },
  { value: '$300-$1000', label: '$300–$1k', sub: 'High ticket' },
  { value: '$1000+', label: '$1,000+', sub: 'VIP / enterprise' },
]

// ── Quick-start suggestions ───────────────────────────────────────────────────

const SELL_SUGGESTIONS = [
  'A Notion template for freelancers',
  'A coaching program for early-career designers',
  'A subscription for fitness plans',
  'An e-book on personal finance',
  'A course on building with AI',
  'A service for social media strategy',
]

const FOR_SUGGESTIONS = [
  'Freelancers and solopreneurs',
  'Beginners starting their career',
  'Busy parents short on time',
  'Small business owners',
  'Creative entrepreneurs',
  'Students learning new skills',
]

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: WizardStep }) {
  const steps = [
    { n: 1, label: 'What' },
    { n: 2, label: 'Who' },
    { n: 3, label: 'Includes' },
    { n: 4, label: 'Price' },
    { n: 5, label: 'Review' },
  ]
  return (
    <div className="flex items-center gap-1 mb-8">
      {steps.map(({ n, label }, idx) => (
        <div key={n} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors',
                step === n
                  ? 'bg-black text-white'
                  : step > n
                    ? 'bg-black text-white opacity-40'
                    : 'bg-neutral-100 text-neutral-400',
              )}
            >
              {step > n ? <CheckCircle2 size={14} /> : n}
            </div>
            <span className={cn('text-[10px] font-medium hidden sm:block', step === n ? 'text-black' : 'text-neutral-400')}>
              {label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className={cn('mx-2 h-px w-8 sm:w-12', step > n ? 'bg-black opacity-30' : 'bg-neutral-200')} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Step 1: What to sell ──────────────────────────────────────────────────────

function Step1({
  data,
  onChange,
  onNext,
}: {
  data: WizardData
  onChange: (d: Partial<WizardData>) => void
  onNext: () => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-black mb-1">What do you want to sell?</h2>
        <p className="text-sm text-neutral-500">Describe your product, service, or idea in a sentence or two.</p>
      </div>

      <Textarea
        label=""
        value={data.whatYouSell}
        onChange={e => onChange({ whatYouSell: e.target.value })}
        rows={3}
        placeholder="e.g. A Notion template system for freelancers to track clients, projects, and invoices in one place"
      />

      <div>
        <p className="text-xs font-medium text-neutral-500 mb-2">Quick start ideas</p>
        <div className="flex flex-wrap gap-2">
          {SELL_SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => onChange({ whatYouSell: s })}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                data.whatYouSell === s
                  ? 'border-black bg-black text-white'
                  : 'border-neutral-200 text-neutral-600 hover:border-neutral-400 hover:text-black',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!data.whatYouSell.trim()}>
          Next <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  )
}

// ── Step 2: Who is it for ─────────────────────────────────────────────────────

function Step2({
  data,
  onChange,
  onBack,
  onNext,
}: {
  data: WizardData
  onChange: (d: Partial<WizardData>) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-black mb-1">Who is it for?</h2>
        <p className="text-sm text-neutral-500">Describe your ideal buyer or customer.</p>
      </div>

      <Textarea
        label=""
        value={data.whoIsItFor}
        onChange={e => onChange({ whoIsItFor: e.target.value })}
        rows={3}
        placeholder="e.g. Freelance designers and developers who want to stay organized without complex project management tools"
      />

      <div>
        <p className="text-xs font-medium text-neutral-500 mb-2">Quick picks</p>
        <div className="flex flex-wrap gap-2">
          {FOR_SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => onChange({ whoIsItFor: s })}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                data.whoIsItFor === s
                  ? 'border-black bg-black text-white'
                  : 'border-neutral-200 text-neutral-600 hover:border-neutral-400 hover:text-black',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft size={14} /> Back</Button>
        <Button onClick={onNext} disabled={!data.whoIsItFor.trim()}>
          Next <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  )
}

// ── Step 3: What's included ───────────────────────────────────────────────────

function Step3({
  data,
  onChange,
  onBack,
  onNext,
}: {
  data: WizardData
  onChange: (d: Partial<WizardData>) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-black mb-1">What is included?</h2>
        <p className="text-sm text-neutral-500">Optional — list what buyers get. AI will fill this in if left blank.</p>
      </div>

      <Textarea
        label=""
        value={data.whatsIncluded}
        onChange={e => onChange({ whatsIncluded: e.target.value })}
        rows={4}
        placeholder="e.g. 15 Notion templates, video walkthrough, client onboarding checklist, invoice tracker, lifetime updates"
      />

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft size={14} /> Back</Button>
        <Button onClick={onNext}>
          Next <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  )
}

// ── Step 4: Price range ───────────────────────────────────────────────────────

function Step4({
  data,
  onChange,
  onBack,
  onGenerate,
  generating,
}: {
  data: WizardData
  onChange: (d: Partial<WizardData>) => void
  onBack: () => void
  onGenerate: () => void
  generating: boolean
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-black mb-1">What price range?</h2>
        <p className="text-sm text-neutral-500">AI will suggest a specific price within this range.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PRICE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange({ priceRange: opt.value })}
            className={cn(
              'rounded-xl border p-3 text-left transition-all hover:border-neutral-400',
              data.priceRange === opt.value
                ? 'border-black bg-black text-white'
                : 'border-neutral-200 bg-white',
            )}
          >
            <p className={cn('font-bold text-sm', data.priceRange === opt.value ? 'text-white' : 'text-black')}>
              {opt.label}
            </p>
            <p className={cn('text-xs', data.priceRange === opt.value ? 'text-white/70' : 'text-neutral-500')}>
              {opt.sub}
            </p>
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={onBack}><ArrowLeft size={14} /> Back</Button>
        <Button
          onClick={onGenerate}
          loading={generating}
          disabled={!data.priceRange}
        >
          <Sparkles size={14} />
          {generating ? 'Generating your plan…' : 'Generate My Store Plan'}
        </Button>
      </div>

      {generating && (
        <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm text-neutral-500 text-center">
          AI is writing your store name, bio, product copy, FAQ, and launch checklist…
          <br />
          <span className="text-xs">This takes 5–20 seconds.</span>
        </div>
      )}
    </div>
  )
}

// ── Step 5: Review draft ──────────────────────────────────────────────────────

function Step5({
  result: initialResult,
  onSaveStore,
  onCreateProduct,
  savingStore,
  savingProduct,
}: {
  result: StoreLaunchOutput
  onSaveStore: (r: StoreLaunchOutput) => Promise<void>
  onCreateProduct: (r: StoreLaunchOutput) => Promise<void>
  savingStore: boolean
  savingProduct: boolean
}) {
  const router = useRouter()
  const [result, setResult] = useState<StoreLaunchOutput>(initialResult)

  function update<K extends keyof StoreLaunchOutput>(key: K, val: StoreLaunchOutput[K]) {
    setResult(prev => ({ ...prev, [key]: val }))
  }

  function updateFaq(idx: number, field: 'question' | 'answer', val: string) {
    setResult(prev => ({
      ...prev,
      faq: prev.faq.map((f, i) => i === idx ? { ...f, [field]: val } : f),
    }))
  }

  function updateIncluded(idx: number, val: string) {
    setResult(prev => ({
      ...prev,
      whatIsIncluded: prev.whatIsIncluded.map((item, i) => i === idx ? val : item),
    }))
  }

  const priceDollars = (result.priceSuggestion / 100).toFixed(2)
  const compareDollars = result.compareAtPriceSuggestion
    ? (result.compareAtPriceSuggestion / 100).toFixed(2)
    : ''

  return (
    <div className="space-y-6">
      {/* Success banner */}
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
        <CheckCircle2 size={17} className="shrink-0 text-emerald-600 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">Your store plan is ready!</p>
          <p className="text-xs text-emerald-700 mt-0.5">
            Review and edit below. Save your store draft first, then create your product when ready.
          </p>
        </div>
      </div>

      {/* Store section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store size={15} className="text-neutral-500" /> Store
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Store Name"
              value={result.storeName}
              onChange={e => update('storeName', e.target.value)}
            />
            <Input
              label="Store URL Slug"
              value={result.storeSlug}
              onChange={e => update('storeSlug', slugify(e.target.value))}
              hint={`/store/${result.storeSlug}`}
            />
          </div>
          <Input
            label="Headline"
            value={result.storeHeadline}
            onChange={e => update('storeHeadline', e.target.value)}
          />
          <Textarea
            label="Store Bio"
            value={result.storeBio}
            onChange={e => update('storeBio', e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Product section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package size={15} className="text-neutral-500" /> Product
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Product Name"
            value={result.productName}
            onChange={e => {
              update('productName', e.target.value)
              update('productSlug', slugify(e.target.value))
            }}
          />
          <Input
            label="URL Slug"
            value={result.productSlug}
            onChange={e => update('productSlug', slugify(e.target.value))}
            hint={`/p/${result.productSlug}`}
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

      {/* Pricing */}
      <Card>
        <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
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
              hint="Strikethrough"
            />
            <Input
              label="CTA Button"
              value={result.ctaText}
              onChange={e => update('ctaText', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* What's included */}
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

      {/* FAQ */}
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

      {/* Marketing copy */}
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
            label="Social Launch Post"
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

      {/* Image prompts */}
      <Card>
        <CardHeader><CardTitle>Image Prompts</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
            Image generation coming soon. Copy these prompts to use with DALL-E, Midjourney, or Canva.
          </div>
          {[
            { label: 'Product Image Prompt', key: 'productImagePrompt' as const },
            { label: 'Store Banner Prompt', key: 'storeBannerPrompt' as const },
          ].map(({ label, key }) => (
            <div key={key}>
              <p className="mb-1.5 text-xs font-medium text-neutral-600">{label}</p>
              <div className="rounded-lg border border-neutral-200 bg-white p-3 font-mono text-xs text-neutral-700 leading-relaxed">
                {result[key] as string}
              </div>
              <div className="mt-2 flex gap-2">
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    void navigator.clipboard.writeText(result[key] as string)
                    toast.success('Copied!')
                  }}
                >
                  Copy Prompt
                </Button>
                <Button size="xs" variant="ghost" disabled>
                  <ImageIcon size={11} /> Generate Image — Coming soon
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Launch checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList size={15} className="text-neutral-500" /> Launch Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {result.launchChecklist.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-700">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-neutral-200 text-[10px] font-bold text-neutral-400">
                  {i + 1}
                </div>
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="rounded-2xl border-2 border-black bg-black p-5 space-y-3">
        <p className="text-white font-semibold text-sm">Ready to launch?</p>
        <p className="text-white/60 text-xs">
          Save your store draft first, then create your product page. Both start as drafts — you choose when to publish.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Button
            variant="secondary"
            onClick={() => onSaveStore(result)}
            loading={savingStore}
            className="bg-white text-black hover:bg-neutral-100"
          >
            <Store size={14} /> Save Store Draft
          </Button>
          <Button
            variant="secondary"
            onClick={() => onCreateProduct(result)}
            loading={savingProduct}
            className="bg-white text-black hover:bg-neutral-100"
          >
            <Package size={14} /> Create Product Draft
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 pt-1 border-t border-white/10">
          <Button
            size="sm"
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => router.push('/dashboard/store')}
          >
            Publish Later
          </Button>
          <Link href="/dashboard/store-editor">
            <Button size="sm" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
              <Layers size={13} /> Open Store Editor
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Main wizard ───────────────────────────────────────────────────────────────

function AILaunchWizardInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialPrompt = searchParams.get('prompt') ?? ''

  const [step, setStep] = useState<WizardStep>(1)
  const [data, setData] = useState<WizardData>({
    whatYouSell: initialPrompt,
    whoIsItFor: '',
    whatsIncluded: '',
    priceRange: '$20-$50',
  })
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<StoreLaunchOutput | null>(null)
  const [savingStore, setSavingStore] = useState(false)
  const [savingProduct, setSavingProduct] = useState(false)

  // Auto-advance to step 2 if a prompt was passed in
  useEffect(() => {
    if (initialPrompt && step === 1) {
      // Don't auto-advance — let user confirm the prompt first
    }
  }, [initialPrompt, step])

  function merge(partial: Partial<WizardData>) {
    setData(prev => ({ ...prev, ...partial }))
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/store-launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = (await res.json()) as { error?: string }
        throw new Error(err.error ?? 'Generation failed')
      }

      const output = (await res.json()) as StoreLaunchOutput
      setResult(output)
      setStep(5)
      toast.success('Store plan generated!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSaveStore(r: StoreLaunchOutput) {
    setSavingStore(true)
    try {
      const existing = await demoStorefrontRepo.findBySellerId(DEMO_SELLER_PROFILE.id)
      await demoStorefrontRepo.upsert({
        sellerId: DEMO_SELLER_PROFILE.id,
        slug: r.storeSlug || existing?.slug || DEMO_SELLER_PROFILE.slug,
        title: r.storeName,
        headline: r.storeHeadline,
        bio: r.storeBio,
        avatarUrl: existing?.avatarUrl ?? null,
        bannerUrl: existing?.bannerUrl ?? null,
        featuredProductIds: existing?.featuredProductIds ?? [],
        productOrder: existing?.productOrder ?? [],
        hiddenProductIds: existing?.hiddenProductIds ?? [],
        themeColor: existing?.themeColor ?? '#000000',
        buttonStyle: existing?.buttonStyle ?? 'rounded',
        cardStyle: existing?.cardStyle ?? 'outline',
        headerLayout: existing?.headerLayout ?? 'centered',
        cardDensity: existing?.cardDensity ?? 'comfortable',
        sectionOrder: existing?.sectionOrder ?? [],
        sectionVisibility: existing?.sectionVisibility ?? {},
        socialLinks: existing?.socialLinks ?? {},
        headerMedia: existing?.headerMedia ?? 'none',
        headerPhotoUrl: existing?.headerPhotoUrl ?? null,
        headerVideoUrl: existing?.headerVideoUrl ?? null,
        published: existing?.published ?? false,
      })
      toast.success('Store draft saved! Visit Store Profile to review.')
    } catch (err) {
      console.error(err)
      toast.error('Failed to save store draft.')
    } finally {
      setSavingStore(false)
    }
  }

  async function handleCreateProduct(r: StoreLaunchOutput) {
    setSavingProduct(true)
    try {
      const newProduct = await demoProductRepo.create({
        sellerId: DEMO_SELLER_PROFILE.id,
        name: r.productName,
        slug: r.productSlug || slugify(r.productName),
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
      toast.success('Product draft created! Redirecting to Product Hub…')
      router.push(`/dashboard/products/${newProduct.id}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to create product.')
    } finally {
      setSavingProduct(false)
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-black transition-colors mb-4"
        >
          <ArrowLeft size={14} /> Back to Overview
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black">
            <Wand2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black">AI Launch Assistant</h1>
            <p className="text-sm text-neutral-500">
              Answer 4 quick questions — AI builds your store and product page.
            </p>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <StepIndicator step={step} />

      {/* Steps */}
      {step === 1 && (
        <Step1
          data={data}
          onChange={merge}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <Step2
          data={data}
          onChange={merge}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <Step3
          data={data}
          onChange={merge}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}
      {step === 4 && (
        <Step4
          data={data}
          onChange={merge}
          onBack={() => setStep(3)}
          onGenerate={handleGenerate}
          generating={generating}
        />
      )}
      {step === 5 && result && (
        <Step5
          result={result}
          onSaveStore={handleSaveStore}
          onCreateProduct={handleCreateProduct}
          savingStore={savingStore}
          savingProduct={savingProduct}
        />
      )}
    </div>
  )
}

export default function AILaunchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    }>
      <AILaunchWizardInner />
    </Suspense>
  )
}
