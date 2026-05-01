'use client'
import { useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, X, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GradientImageFallback } from '@/components/ui/gradient-image-fallback'
import { uploadFile, buildStoragePath } from '@/lib/supabase/storage'
import type { UploadBucket } from '@/lib/supabase/storage'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'

interface ImageUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  label?: string
  hint?: string
  productType?: string
  /** Supabase bucket to upload to. Omit to stay in data-URL (demo) mode. */
  bucket?: UploadBucket
  /** Storage path prefix (e.g. seller ID). Defaults to demo seller id. */
  ownerId?: string
}

export function ImageUpload({
  value,
  onChange,
  label = 'Product Image',
  hint = 'Recommended: 1200×630px, JPG or PNG.',
  productType,
  bucket,
  ownerId = DEMO_SELLER_PROFILE.id,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [broken, setBroken] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setBroken(false)
    setUploadError(null)

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file (JPG, PNG, WebP).')
      return
    }

    if (bucket) {
      // Upload to Supabase Storage (or get object URL if Supabase not configured)
      setUploading(true)
      const path = buildStoragePath(ownerId, file.name)
      const result = await uploadFile(bucket, path, file)
      setUploading(false)

      if (result.error) {
        setUploadError(result.error)
        return
      }
      if (result.url) {
        onChange(result.url)
      }
    } else {
      // Fallback: read as data URL (demo / no bucket configured)
      const reader = new FileReader()
      reader.onload = (e) => {
        const res = e.target?.result as string
        onChange(res)
      }
      reader.readAsDataURL(file)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void handleFile(file)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-neutral-700">{label}</label>

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50">
          <div className="aspect-video relative w-full">
            {broken ? (
              <GradientImageFallback productType={productType} />
            ) : (
              <Image
                src={value}
                alt="Upload preview"
                fill
                className="object-cover"
                unoptimized
                onError={() => setBroken(true)}
              />
            )}
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 bg-white text-black text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              Replace
            </button>
            <button
              type="button"
              onClick={() => { onChange(null); setBroken(false) }}
              className="flex items-center gap-1.5 bg-white text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <X size={13} />Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          disabled={uploading}
          className={cn(
            'w-full aspect-video flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors cursor-pointer disabled:cursor-not-allowed',
            dragging
              ? 'border-black bg-neutral-50'
              : 'border-neutral-200 bg-neutral-50 hover:border-neutral-400 hover:bg-white'
          )}
        >
          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
            {uploading
              ? <Loader2 size={18} className="text-neutral-400 animate-spin" />
              : <ImagePlus size={18} className="text-neutral-400" />
            }
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-neutral-700">
              {uploading ? 'Uploading…' : 'Click to upload image'}
            </p>
            {!uploading && <p className="text-xs text-neutral-400 mt-0.5">or drag and drop</p>}
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />
      {uploadError ? (
        <p className="text-xs text-red-500">{uploadError}</p>
      ) : (
        <p className="text-xs text-neutral-500">{hint}</p>
      )}
    </div>
  )
}
