'use client'
import { useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, X, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GradientImageFallback } from '@/components/ui/gradient-image-fallback'

interface ImageUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  label?: string
  hint?: string
  productType?: string
}

export function ImageUpload({ value, onChange, label = 'Product Image', hint = 'Shown on your sell page. Recommended: 1200×630px, JPG or PNG.', productType }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [broken, setBroken] = useState(false)

  function handleFile(file: File) {
    setBroken(false)
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      onChange(result)
    }
    reader.readAsDataURL(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
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
              <Image src={value} alt="Product thumbnail" fill className="object-cover" unoptimized onError={() => setBroken(true)} />
            )}
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 bg-white text-black text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <Upload size={13} />Replace
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
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
          className={cn(
            'w-full aspect-video flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors cursor-pointer',
            dragging
              ? 'border-black bg-neutral-50'
              : 'border-neutral-200 bg-neutral-50 hover:border-neutral-400 hover:bg-white'
          )}
        >
          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
            <ImagePlus size={18} className="text-neutral-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-neutral-700">Click to upload image</p>
            <p className="text-xs text-neutral-400 mt-0.5">or drag and drop</p>
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
      <p className="text-xs text-neutral-500">{hint}</p>
    </div>
  )
}
