'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Info, Loader2, Pencil, Sparkles, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadFile, buildStoragePath } from '@/lib/supabase/storage'
import type { UploadBucket } from '@/lib/supabase/storage'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'

const AI_NOT_CONFIGURED_MSG = 'AI image generation is not configured yet.'
const MAX_REF_IMAGES = 3

// ── Types ─────────────────────────────────────────────────────────────────────

export type AiImageType = 'product' | 'store_banner' | 'store_avatar'

interface RefImage {
  id: string
  name: string
  dataUrl: string
}

interface AiImagePickerProps {
  value: string | null
  onChange: (url: string) => void
  imageType?: AiImageType
  bucket?: UploadBucket
  ownerId?: string
  label?: string
  aspectClass?: string
  hint?: string
  /**
   * Compact mode — skips the large image-well preview entirely.
   * Use this when the parent already renders its own avatar/photo preview.
   * Action buttons and AI panels still appear; only the big empty canvas is hidden.
   */
  compact?: boolean
}

type PanelMode = 'idle' | 'generate' | 'edit'
type PanelStatus = 'form' | 'loading' | 'preview'

// ── Constants ─────────────────────────────────────────────────────────────────

const STYLE_CHIPS = ['Clean studio', 'Lifestyle', 'Minimal', 'Premium', 'Bold ad'] as const

const PLACEHOLDER_BY_TYPE: Record<AiImageType, string> = {
  product:      'Create a clean product image for a Notion template pack.',
  store_banner: 'Create a wide store banner for a creator selling digital products.',
  store_avatar: 'Create a simple brand avatar for a creator store.',
}

const LOADING_STEPS = [
  'Understanding your prompt...',
  'Creating your image...',
  'Polishing the design...',
  'Preparing your asset...',
]

// ── Mini inline loading animation ────────────────────────────────────────────

function AiLoading() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % LOADING_STEPS.length), 2000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col items-center py-8 select-none">
      <div className="relative w-11 h-11 mb-4">
        <div className="absolute inset-0 rounded-xl bg-black animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles
            size={18}
            className="text-white"
            style={{ animation: 'spin 4s linear infinite' }}
          />
        </div>
      </div>
      <p className="text-sm font-medium text-black text-center leading-snug">
        {LOADING_STEPS[step]}
      </p>
      <div className="flex gap-1.5 mt-3">
        {LOADING_STEPS.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 w-1.5 rounded-full transition-colors duration-300',
              i === step ? 'bg-black' : 'bg-neutral-200',
            )}
          />
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function AiImagePicker({
  value,
  onChange,
  imageType = 'product',
  bucket,
  ownerId = DEMO_SELLER_PROFILE.id,
  label,
  aspectClass = 'aspect-video',
  hint,
  compact = false,
}: AiImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const refInputRef  = useRef<HTMLInputElement>(null)

  // Panel state
  const [mode, setMode]         = useState<PanelMode>('idle')
  const [status, setStatus]     = useState<PanelStatus>('form')
  const [preview, setPreview]   = useState<string | null>(null)

  // Generate form state
  const [genPrompt, setGenPrompt]     = useState('')
  const [style, setStyle]             = useState<string>('Clean studio')
  const [refImages, setRefImages]     = useState<RefImage[]>([])
  const [refDragOver, setRefDragOver] = useState(false)

  // Edit form state
  const [editPrompt, setEditPrompt] = useState('')

  // Shared
  const [error, setError]                   = useState<string | null>(null)
  const [aiUnavailable, setAiUnavailable]   = useState(false)
  const [uploading, setUploading]           = useState(false)
  const [broken, setBroken]                 = useState(false)

  function openPanel(m: PanelMode) {
    setMode(m)
    setStatus('form')
    setPreview(null)
    setError(null)
    setAiUnavailable(false)
    setRefImages([])
  }

  function closePanel() {
    setMode('idle')
    setStatus('form')
    setPreview(null)
    setError(null)
    setAiUnavailable(false)
    setRefImages([])
  }

  // ── Upload ──────────────────────────────────────────────────────────────────

  async function handleFile(file: File) {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('Please select a JPG, PNG, or WebP image.')
      return
    }

    if (bucket) {
      setUploading(true)
      const path = buildStoragePath(ownerId, file.name)
      const result = await uploadFile(bucket, path, file)
      setUploading(false)
      if (result.error) { setError(result.error); return }
      if (result.url) { onChange(result.url); closePanel() }
    } else {
      const reader = new FileReader()
      reader.onload = e => {
        const url = e.target?.result as string
        onChange(url)
        closePanel()
      }
      reader.readAsDataURL(file)
    }
  }

  // ── Reference images ─────────────────────────────────────────────────────────

  function readAsDataUrl(file: File): Promise<string> {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = e => resolve(e.target?.result as string)
      reader.readAsDataURL(file)
    })
  }

  async function handleRefFiles(files: FileList) {
    const toAdd = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .slice(0, MAX_REF_IMAGES - refImages.length)
    const newRefs: RefImage[] = await Promise.all(
      toAdd.map(async (f, i) => ({
        id: `ref-${Date.now()}-${i}`,
        name: f.name,
        dataUrl: await readAsDataUrl(f),
      })),
    )
    setRefImages(prev => [...prev, ...newRefs].slice(0, MAX_REF_IMAGES))
  }

  function removeRefImage(id: string) {
    setRefImages(prev => prev.filter(r => r.id !== id))
  }

  // ── Generate ────────────────────────────────────────────────────────────────

  async function handleGenerate() {
    if (genPrompt.trim().length < 5) {
      setError('Please enter a more descriptive prompt.')
      return
    }
    setError(null)
    setAiUnavailable(false)
    setStatus('loading')

    try {
      const res = await fetch('/api/ai/generate-image', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: genPrompt.trim(),
          style,
          imageType,
          ownerId,
          // TODO: Use referenceImages with OpenAI multimodal image generation when enabled.
          referenceImages: refImages.map(r => ({ name: r.name, dataUrl: r.dataUrl })),
        }),
      })
      const data = await res.json() as { success?: boolean; imageUrl?: string; error?: string }
      if (!res.ok || !data.imageUrl) {
        if (data.error === AI_NOT_CONFIGURED_MSG) {
          setAiUnavailable(true)
        } else {
          setError(data.error ?? 'Generation failed. Please try again.')
        }
        setStatus('form')
        return
      }
      setPreview(data.imageUrl)
      setStatus('preview')
    } catch {
      setError('Network error. Please try again.')
      setStatus('form')
    }
  }

  // ── Edit ────────────────────────────────────────────────────────────────────

  async function handleEdit() {
    if (editPrompt.trim().length < 5) {
      setError('Please describe what you want to change.')
      return
    }
    setError(null)
    setAiUnavailable(false)
    setStatus('loading')

    try {
      const res = await fetch('/api/ai/edit-image', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt:          editPrompt.trim(),
          imageType,
          currentImageUrl: value,
          ownerId,
        }),
      })
      const data = await res.json() as { success?: boolean; imageUrl?: string; error?: string }
      if (!res.ok || !data.imageUrl) {
        if (data.error === AI_NOT_CONFIGURED_MSG) {
          setAiUnavailable(true)
        } else {
          setError(data.error ?? 'Edit failed. Please try again.')
        }
        setStatus('form')
        return
      }
      setPreview(data.imageUrl)
      setStatus('preview')
    } catch {
      setError('Network error. Please try again.')
      setStatus('form')
    }
  }

  // ── Confirm preview ─────────────────────────────────────────────────────────

  function usePreview() {
    if (preview) {
      onChange(preview)
      closePanel()
    }
  }

  function retryFromPreview() {
    setPreview(null)
    setStatus('form')
    setError(null)
  }

  // ── Preview container sizing ─────────────────────────────────────────────────
  // In compact mode (store avatar) cap the generated preview so it doesn't dwarf the card.
  const previewContainerClass = compact
    ? 'relative w-full max-w-[280px] aspect-square mx-auto rounded-lg overflow-hidden border border-neutral-200'
    : cn('relative w-full rounded-lg overflow-hidden border border-neutral-200', aspectClass)

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-neutral-700">{label}</label>
      )}

      {/* ── Image well — hidden in compact mode (parent owns the preview) ── */}
      {!compact && (
        <div
          className={cn(
            'relative w-full rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50',
            aspectClass,
          )}
        >
          {value && !broken ? (
            <Image
              src={value}
              alt="Image preview"
              fill
              className="object-cover"
              unoptimized
              onError={() => setBroken(true)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-400">
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                {uploading
                  ? <Loader2 size={18} className="animate-spin text-neutral-400" />
                  : <Upload size={18} className="text-neutral-400" />
                }
              </div>
              <p className="text-xs font-medium text-neutral-500">
                {uploading ? 'Uploading…' : 'No image yet'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Action bar ── */}
      <div className="flex gap-2 flex-wrap">
        {/* Upload */}
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-40"
        >
          {uploading
            ? <Loader2 size={12} className="animate-spin" />
            : <Upload size={12} />
          }
          Upload image
        </button>

        {/* Generate with AI */}
        <button
          type="button"
          onClick={() => mode === 'generate' ? closePanel() : openPanel('generate')}
          className={cn(
            'flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border transition-colors',
            mode === 'generate'
              ? 'border-black bg-black text-white'
              : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50',
          )}
        >
          <Sparkles size={12} />
          Generate with AI
        </button>

        {/* Edit with AI — only if there is a current image */}
        {value && (
          <button
            type="button"
            onClick={() => mode === 'edit' ? closePanel() : openPanel('edit')}
            className={cn(
              'flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border transition-colors',
              mode === 'edit'
                ? 'border-black bg-black text-white'
                : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50',
            )}
          >
            <Pencil size={12} />
            Edit with AI
          </button>
        )}
      </div>

      {/* Hint */}
      {hint && mode === 'idle' && (
        <p className="text-xs text-neutral-500">{hint}</p>
      )}

      {/* ── Panels ──────────────────────────────────────────────────────────── */}

      {mode !== 'idle' && (
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <div className="flex items-center gap-1.5">
              {mode === 'generate'
                ? <Sparkles size={13} className="text-black" />
                : <Pencil    size={13} className="text-black" />
              }
              <span className="text-sm font-semibold text-black">
                {mode === 'generate' ? 'Generate with AI' : 'Edit with AI'}
              </span>
            </div>
            <button
              type="button"
              onClick={closePanel}
              className="w-6 h-6 flex items-center justify-center rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="p-4">
            {/* ── Loading ── */}
            {status === 'loading' && <AiLoading />}

            {/* ── Preview ── */}
            {status === 'preview' && preview && (
              <div className="space-y-3">
                <div className={previewContainerClass}>
                  <Image
                    src={preview}
                    alt="Generated image preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={usePreview}
                    className="flex-1 h-9 rounded-lg bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
                  >
                    Use this image
                  </button>
                  <button
                    type="button"
                    onClick={retryFromPreview}
                    className="h-9 px-4 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    Try again
                  </button>
                  <button
                    type="button"
                    onClick={closePanel}
                    className="h-9 px-4 rounded-lg text-xs font-medium text-neutral-500 hover:text-neutral-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── Generate form ── */}
            {status === 'form' && mode === 'generate' && (
              <div className="space-y-3">
                {aiUnavailable ? (
                  <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
                    <Info size={14} className="mt-0.5 flex-shrink-0 text-amber-500" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800">AI image generation is not enabled yet.</p>
                      <p className="mt-0.5 text-xs text-amber-700">Upload an image for now — AI generation will be available soon.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Prompt */}
                    <div>
                      <label className="text-xs font-medium text-neutral-700 block mb-1.5">
                        Describe the image you want
                      </label>
                      <textarea
                        value={genPrompt}
                        onChange={e => setGenPrompt(e.target.value)}
                        placeholder={PLACEHOLDER_BY_TYPE[imageType]}
                        rows={3}
                        className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-400 resize-none"
                      />
                    </div>

                    {/* Reference images */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-neutral-700">Reference images</label>
                        <span className="text-[10px] text-neutral-400">{refImages.length}/{MAX_REF_IMAGES}</span>
                      </div>

                      {/* Thumbnails of added reference images */}
                      {refImages.length > 0 && (
                        <div className="flex gap-2 flex-wrap mb-2">
                          {refImages.map(ref => (
                            <div
                              key={ref.id}
                              className="relative w-14 h-14 rounded-lg overflow-hidden border border-neutral-200 flex-shrink-0"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={ref.dataUrl}
                                alt={ref.name}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeRefImage(ref.id)}
                                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center hover:bg-black transition-colors"
                              >
                                <X size={8} className="text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Drag/drop zone — hidden once max reached */}
                      {refImages.length < MAX_REF_IMAGES && (
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => refInputRef.current?.click()}
                          onKeyDown={e => e.key === 'Enter' && refInputRef.current?.click()}
                          onDragOver={e => { e.preventDefault(); setRefDragOver(true) }}
                          onDragLeave={() => setRefDragOver(false)}
                          onDrop={e => {
                            e.preventDefault()
                            setRefDragOver(false)
                            if (e.dataTransfer.files.length) void handleRefFiles(e.dataTransfer.files)
                          }}
                          className={cn(
                            'flex items-center gap-2 rounded-lg border-2 border-dashed px-3 py-2.5 text-xs cursor-pointer select-none transition-colors',
                            refDragOver
                              ? 'border-black bg-neutral-50 text-black'
                              : 'border-neutral-200 text-neutral-400 hover:border-neutral-400 hover:text-neutral-600',
                          )}
                        >
                          <ImagePlus size={13} className="flex-shrink-0" />
                          <span>Drag images here or click to upload</span>
                        </div>
                      )}

                      <p className="mt-1.5 text-[10px] text-neutral-400 leading-relaxed">
                        Optional: add brand, style, or inspiration images to guide the AI.
                        Reference support is coming soon.
                      </p>
                    </div>

                    {/* Style chips */}
                    <div>
                      <label className="text-xs font-medium text-neutral-700 block mb-1.5">Style</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {STYLE_CHIPS.map(chip => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setStyle(chip)}
                            className={cn(
                              'h-7 px-3 rounded-full text-[11px] font-medium border transition-colors',
                              style === chip
                                ? 'bg-black border-black text-white'
                                : 'border-neutral-200 text-neutral-600 hover:border-neutral-400',
                            )}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>

                    {error && <p className="text-xs text-red-500">{error}</p>}
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="w-full h-9 rounded-lg bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Sparkles size={12} />
                      Generate image
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── Edit form ── */}
            {status === 'form' && mode === 'edit' && (
              <div className="space-y-3">
                {aiUnavailable ? (
                  <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
                    <Info size={14} className="mt-0.5 flex-shrink-0 text-amber-500" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800">AI image generation is not enabled yet.</p>
                      <p className="mt-0.5 text-xs text-amber-700">Upload an image for now — AI generation will be available soon.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {value && (
                      <div>
                        <p className="text-xs font-medium text-neutral-700 mb-1.5">Current image</p>
                        <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-neutral-200">
                          <Image
                            src={value}
                            alt="Current image"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium text-neutral-700 block mb-1.5">
                        What do you want AI to change?
                      </label>
                      <textarea
                        value={editPrompt}
                        onChange={e => setEditPrompt(e.target.value)}
                        placeholder="Make this look like a clean studio product shot with white background."
                        rows={3}
                        className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-400 resize-none"
                      />
                    </div>
                    <div className="rounded-lg bg-neutral-50 border border-neutral-100 p-3">
                      <p className="text-[11px] font-semibold text-neutral-500 mb-1.5">Examples</p>
                      <ul className="space-y-1">
                        {[
                          'Make the background white and premium.',
                          'Turn this into a wide store banner.',
                          'Make this feel more modern and high-converting.',
                        ].map(ex => (
                          <li key={ex}>
                            <button
                              type="button"
                              onClick={() => setEditPrompt(ex)}
                              className="text-[11px] text-neutral-500 hover:text-black transition-colors text-left"
                            >
                              &ldquo;{ex}&rdquo;
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    <button
                      type="button"
                      onClick={handleEdit}
                      className="w-full h-9 rounded-lg bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Sparkles size={12} />
                      Create new version
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />
      <input
        ref={refInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => {
          if (e.target.files?.length) void handleRefFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
