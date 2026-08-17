'use client'

import { useState } from 'react'
import { Download, X } from 'lucide-react'
import { toast } from 'sonner'

interface ProductFileRowProps {
  fileName: string
  fileSize?: number | null
  fileType?: string | null
  storagePath: string | null
  productId?: string | null
  fileId?: string | null
  onRemove?: () => void
}

function isPreviewable(type: string | null | undefined, name: string): boolean {
  const mime = type?.toLowerCase() ?? ''
  if (mime.startsWith('image/') || mime === 'application/pdf') return true
  const ext = name.split('.').pop()?.toLowerCase()
  return ['png', 'jpg', 'jpeg', 'webp', 'gif', 'pdf'].includes(ext ?? '')
}

export function ProductFileRow({
  fileName,
  fileSize,
  fileType,
  storagePath,
  productId,
  fileId,
  onRemove,
}: ProductFileRowProps) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    if (!storagePath) {
      toast.error('File not available yet.')
      return
    }

    setLoading(true)
    try {
      let url: string | null = null

      if (productId && fileId) {
        const res = await fetch(
          `/api/products/${productId}/files/download?fileId=${encodeURIComponent(fileId)}`,
        )
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error ?? 'Could not open file.')
          return
        }
        url = data.download_url ?? null
      }

      if (!url) {
        toast.error('Could not open file.')
        return
      }

      const preview = isPreviewable(fileType, fileName)
      if (preview) {
        window.open(url, '_blank', 'noopener,noreferrer')
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.rel = 'noopener noreferrer'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3 bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-200">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 truncate">{fileName}</p>
        {fileSize != null && fileSize > 0 && (
          <p className="text-xs text-neutral-500">{(fileSize / 1024 / 1024).toFixed(1)} MB</p>
        )}
      </div>
      {storagePath && (
        <button
          type="button"
          onClick={handleDownload}
          disabled={loading}
          className="p-1.5 text-neutral-400 hover:text-black transition-colors disabled:opacity-50"
          title="Download or preview file"
          aria-label="Download or preview file"
        >
          <Download size={14} />
        </button>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
          aria-label="Remove file"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
