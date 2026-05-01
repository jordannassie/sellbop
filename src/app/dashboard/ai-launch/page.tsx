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
import { AIGenerating } from '@/components/dashboard/ai-generating'
import { AiComposer } from '@/components/ai/ai-composer'
import { AiSkeleton } from '@/components/ai/ai-skeleton'
import { clearLaunchIdea } from '@/lib/launch-idea'
import { toast } from 'sonner'
import { slugify } from '@/lib/utils'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Image as ImageIcon,
  Layers,
  Package,
  Sparkles,
  Store,
  Wand2,
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

// Used by AiComposer on Step 1
const WHAT_YOU_SELL_PROMPTS = [
  'A Notion template for freelancers',
  'A coaching program for early-career designers',
  'A subscription for fitness plans',
  'An e-book on personal finance',
  'A course on building with AI',
  'A service for social media strategy',
] as const

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

// ── Step 1 ────────────────────────────────────────────────────────────────────

function Step1({ data, onChange, onNext }: {
  data: WizardData
  onChange: (d: Partial<WizardData>) => void
  onNext: () => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-black mb-1">What would you like to sell?</h2>
        <p className="text-sm text-neutral-500">
          Describe your product, service, or idea — SellBop will handle the rest.
        </p>
      </div>
      <AiComposer
        value={data.whatYouSell}
        onChange={v => onChange({ whatYouSell: v })}
        onSubmit={() => { if (data.whatYouSell.trim()) onNext() }}
        submitLabel="Continue →"
        rows={3}
        placeholder="e.g. A Notion template system for freelancers to track clients, projects, and invoices in one place"
        typeChips={[]}
        quickPrompts={WHAT_YOU_SELL_PROMPTS}
      />
    </div>
  )
}

// ── Step 2 ────────────────────────────────────────────────────────────────────

function Step2({ data, onChange, onBack, onNext }: {
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

// ── Step 3 ────────────────────────────────────────────────────────────────────

function Step3({ data, onChange, onBack, onNext }: {
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
        <Button onClick={onNext}>Next <ArrowRight size={14} /></Button>
      </div>
    </div>
  )
}

// ── Step 4 ────────────────────────────────────────────────────────────────────

function Step4({ data, onChange, onBack, onGenerate }: {
  data: WizardData
  onChange: (d: Partial<WizardData>) => void
  onBack: () => void
  onGenerate: () => void
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
        <Button onClick={onGenerate} disabled={!data.priceRange}>
          <Sparkles size={14} /> Generate My Store Plan
        </Button>
      </div>
    </div>
  )
}

// ── Step 5: Review & Apply ────────────────────────────────────────────────────

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
    setResult(prev => ({ ...prev, faq: prev.faq.map((f, i) => i === idx ? { ...f, [field]: val } : f) }))
  }
  function updateIncluded(idx: number, val: string) {
    setResult(prev => ({ ...prev, whatIsIncluded: prev.whatIsIncluded.map((item, i) => i === idx ? val : item) }))
  }

  const priceDollars  = (result.priceSuggestion / 100).toFixed(2)
  const compareDollars = result.compareAtPriceSuggestion
    ? (result.compareAtPriceSuggestion / 100).toFixed(2)
    : ''

  return (
    <div className="space-y-6">

      {/* ── AI Result Summary Card ──────────────────────────── */}
      <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={13} className="text-neutral-400" />
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">AI Generated</span>
        </div>
        <div className="flex items-start gap-4 mb-4">
          <div
            className="h-14 w-14 rounded-xl bg-black flex items-center justify-center text-white font-black text-2xl flex-shrink-0"
            aria-hidden
          >
            {result.storeName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-black text-lg leading-tight">{result.storeName}</p>
            <p className="text-sm text-neutral-500 mt-0.5">{result.storeHeadline}</p>
            <p className="text-xs text-neutral-400 mt-1 font-mono">sellbop.com/store/{result.storeSlug}</p>
          </div>
        </div>
        <div className="border-t border-neutral-100 pt-4 grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] text-neutral-400 mb-0.5">Product</p>
            <p className="text-xs font-semibold text-black truncate">{result.productName}</p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 mb-0.5">Price</p>
            <p className="text-xs font-semibold text-black">${(result.priceSuggestion / 100).toFixed(0)}</p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 mb-0.5">Type</p>
            <p className="text-xs font-semibold text-black capitalize">
              {result.productType?.replace(/_/g, ' ') ?? 'Digital'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Action CTA ─────────────────────────────────────── */}
      <div className="rounded-2xl border-2 border-black bg-black p-5 space-y-4">
        <div>
          <p className="text-white font-semibold text-sm">Ready to launch?</p>
          <p className="text-white/60 text-xs mt-0.5">
            Apply your store draft first, then create your product. Both start as drafts — you choose when to publish.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            onClick={() => onSaveStore(result)}
            loading={savingStore}
            variant="secondary"
            className="bg-white text-black hover:bg-neutral-100 w-full justify-center"
          >
            <Store size={14} /> Apply to Store
          </Button>
          <Button
            onClick={() => onCreateProduct(result)}
            loading={savingProduct}
            variant="secondary"
            className="bg-white text-black hover:bg-neutral-100 w-full justify-center"
          >
            <Package size={14} /> Create Product
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 pt-1 border-t border-white/10">
          <Button
            size="sm"
            variant="ghost"
            className="text-white/60 hover:text-white hover:bg-white/10"
            onClick={() => router.push('/dashboard/store')}
          >
            Publish Later
          </Button>
          <Link href="/dashboard/store-editor">
            <Button size="sm" variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10">
              <Layers size={13} /> Open Store Editor
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Editable fields ────────────────────────────────── */}
      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Edit before saving</p>

      {/* Store */}
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
              label="Store link"
              value={result.storeSlug}
              onChange={e => update('storeSlug', slugify(e.target.value))}
              hint={`sellbop.com/store/${result.storeSlug}`}
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

      {/* Product */}
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
            onChange={e => { update('productName', e.target.value); update('productSlug', slugify(e.target.value)) }}
          />
          <Input
            label="Product link"
            value={result.productSlug}
            onChange={e => update('productSlug', slugify(e.target.value))}
            hint={`sellbop.com/p/${result.productSlug}`}
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
              label="Compare-at"
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
            <Input key={i} label={`Item ${i + 1}`} value={item} onChange={e => updateIncluded(i, e.target.value)} />
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
            Copy these prompts to generate images. You can also use{' '}
            <Link href="/dashboard/storefront" className="font-medium text-black underline underline-offset-2">
              AI image tools
            </Link>{' '}
            in Store Profile to generate and set your store visuals directly.
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
                  onClick={() => { void navigator.clipboard.writeText(result[key] as string); toast.success('Copied!') }}
                >
                  Copy Prompt
                </Button>
                <Link href="/dashboard/storefront">
                  <Button size="xs" variant="ghost">
                    <ImageIcon size={11} /> Open AI Image Tools
                  </Button>
                </Link>
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

      {/* Bottom repeat CTA */}
      <div className="rounded-2xl border-2 border-black bg-black p-5 space-y-3">
        <p className="text-white font-semibold text-sm">Apply your plan</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            onClick={() => onSaveStore(result)}
            loading={savingStore}
            variant="secondary"
            className="bg-white text-black hover:bg-neutral-100 w-full justify-center"
          >
            <Store size={14} /> Apply to Store
          </Button>
          <Button
            onClick={() => onCreateProduct(result)}
            loading={savingProduct}
            variant="secondary"
            className="bg-white text-black hover:bg-neutral-100 w-full justify-center"
          >
            <Package size={14} /> Create Product
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-2">
          <p className="text-xs text-white/40 self-center">
            <ExternalLink size={10} className="inline mr-1" />
            Store: sellbop.com/store/{result.storeSlug} · Product: sellbop.com/p/{result.productSlug}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Main wizard ───────────────────────────────────────────────────────────────

function AILaunchWizardInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Support both ?idea= (new flow from homepage) and legacy ?prompt=
  const initialIdea   = searchParams.get('idea') ?? ''
  const initialPrompt = initialIdea || (searchParams.get('prompt') ?? '')

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

  // Suppress unused effect warning — initialIdea/initialPrompt pre-fills
  // the input but we don't auto-advance so the user can confirm.
  useEffect(() => { /* intentionally no-op */ }, [initialIdea, initialPrompt])

  function merge(partial: Partial<WizardData>) {
    setData(prev => ({ ...prev, ...partial }))
  }

  async function handleGenerate() {
    // Clear the stored idea from localStorage — the user is now committed
    // to building, so we don't need it for future redirects.
    clearLaunchIdea()
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
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-black transition-colors mb-5"
        >
          <ArrowLeft size={14} /> Back to Overview
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black">
            <Wand2 size={18} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-black">AI Launch Assistant</h1>
        </div>
        <p className="text-sm text-neutral-500 max-w-lg ml-[52px]">
          Answer a few quick questions and SellBop will draft your store, product page, pricing, FAQ, and launch copy.
        </p>
      </div>

      {/* ── Generating screen (replaces step content) ──────── */}
      {generating && (
        <>
          <AIGenerating />
          <AiSkeleton />
        </>
      )}

      {/* ── Step indicator (hidden while generating) ───────── */}
      {!generating && <StepIndicator step={step} />}

      {/* ── Pre-filled idea confirmation (shown when coming from homepage) ─ */}
      {!generating && step === 1 && initialIdea && data.whatYouSell && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 mb-4">
          <Sparkles size={13} className="text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-medium text-emerald-700">
            Your store idea is ready. Let&apos;s build it.
          </p>
        </div>
      )}

      {/* ── Step content ────────────────────────────────────── */}
      {!generating && step === 1 && (
        <Step1 data={data} onChange={merge} onNext={() => setStep(2)} />
      )}
      {!generating && step === 2 && (
        <Step2 data={data} onChange={merge} onBack={() => setStep(1)} onNext={() => setStep(3)} />
      )}
      {!generating && step === 3 && (
        <Step3 data={data} onChange={merge} onBack={() => setStep(2)} onNext={() => setStep(4)} />
      )}
      {!generating && step === 4 && (
        <Step4 data={data} onChange={merge} onBack={() => setStep(3)} onGenerate={handleGenerate} />
      )}
      {!generating && step === 5 && result && (
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
