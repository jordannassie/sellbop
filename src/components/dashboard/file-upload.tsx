'use client'
import { useRef, useState } from 'react'
import { FileUp, Loader2, CheckCircle2, X, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadFile, buildStoragePath } from '@/lib/supabase/storage'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'

export interface UploadedFile {
  fileName: string
  fileUrl: string | null
  storagePath: string | null
  fileType: string
  fileSize: number
  isPrivate: boolean
}

interface FileUploadProps {
  onUploaded: (file: UploadedFile) => void
  ownerId?: string
}

export function FileUpload({ onUploaded, ownerId = DEMO_SELLER_PROFILE.id }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleFile(file: File) {
    setError(null)
    setDone(false)
    setUploading(true)

    const path = buildStoragePath(ownerId, file.name)
    const result = await uploadFile('product-files', path, file)
    setUploading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setDone(true)
    setTimeout(() => setDone(false), 2000)

    onUploaded({
      fileName: file.name,
      fileUrl: result.url,         // null for private bucket
      storagePath: result.path,    // path for signed URL generation later
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
      isPrivate: result.url === null && result.path !== null,
    })

    // Reset input so same file can be re-selected
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void handleFile(file)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        disabled={uploading}
        className={cn(
          'w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-5 text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed',
          done
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : dragging
            ? 'border-black bg-neutral-50 text-black'
            : 'border-neutral-200 bg-neutral-50 hover:border-neutral-400 hover:bg-white text-neutral-600'
        )}
      >
        {uploading ? (
          <><Loader2 size={16} className="animate-spin" /> Uploading…</>
        ) : done ? (
          <><CheckCircle2 size={16} /> Uploaded</>
        ) : (
          <><FileUp size={16} /> Click or drag a file to upload</>
        )}
      </button>

      <input ref={inputRef} type="file" className="hidden" onChange={e => {
        const file = e.target.files?.[0]
        if (file) void handleFile(file)
      }} />

      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <X size={11} /> {error}
        </p>
      )}

      <p className="flex items-center gap-1 text-[11px] text-neutral-400">
        <Lock size={10} /> Files are stored securely. Buyers receive access after purchase.
      </p>
    </div>
  )
}
