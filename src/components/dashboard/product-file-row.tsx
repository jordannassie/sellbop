'use client'

import { useEffect, useState } from 'react'
import {
  Download,
  X,
  FileText,
  FileImage,
  FileArchive,
  FileSpreadsheet,
  File,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ProductFileRowProps {
  fileName: string
  fileSize?: number | null
  fileType?: string | null
  storagePath: string | null
  productId?: string | null
  fileId?: string | null
  /** Local blob/object URL before the product is saved (create flow). */
  previewUrl?: string | null
  onRemove?: () => void
}

type FileKind = 'image' | 'pdf' | 'archive' | 'spreadsheet' | 'document' | 'other'

function getFileKind(fileName: string, fileType?: string | null): FileKind {
  const mime = fileType?.toLowerCase() ?? ''
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''

  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
    return 'image'
  }
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf'
  if (
    mime.includes('zip') ||
    mime.includes('compressed') ||
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)
  ) {
    return 'archive'
  }
  if (
    mime.includes('sheet') ||
    mime.includes('excel') ||
    mime === 'text/csv' ||
    ['xlsx', 'xls', 'csv'].includes(ext)
  ) {
    return 'spreadsheet'
  }
  if (
    mime.includes('word') ||
    mime.includes('document') ||
    mime.includes('presentation') ||
    ['doc', 'docx', 'ppt', 'pptx', 'txt'].includes(ext)
  ) {
    return 'document'
  }
  return 'other'
}

function formatFileSize(bytes: number | null | undefined): string | null {
  if (bytes == null || bytes <= 0) return null
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function isPreviewable(type: string | null | undefined, name: string): boolean {
  const kind = getFileKind(name, type)
  return kind === 'image' || kind === 'pdf'
}

function FileTypeIcon({ kind }: { kind: FileKind }) {
  const className = 'text-neutral-500'
  switch (kind) {
    case 'pdf':
      return <FileText size={22} className="text-red-500" />
    case 'archive':
      return <FileArchive size={22} className={className} />
    case 'spreadsheet':
      return <FileSpreadsheet size={22} className="text-emerald-600" />
    case 'document':
      return <FileText size={22} className={className} />
    case 'image':
      return <FileImage size={22} className={className} />
    default:
      return <File size={22} className={className} />
  }
}

function FilePreviewThumb({
  fileName,
  fileType,
  previewUrl,
  loading,
  onClick,
}: {
  fileName: string
  fileType?: string | null
  previewUrl: string | null
  loading?: boolean
  onClick?: () => void
}) {
  const kind = getFileKind(fileName, fileType)

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-neutral-200 bg-white',
        onClick && 'cursor-pointer hover:border-neutral-400 transition-colors',
        !onClick && 'cursor-default',
      )}
      title={onClick ? 'Preview file' : undefined}
    >
      {loading ? (
        <div className="w-full h-full flex items-center justify-center bg-neutral-100">
          <div className="w-4 h-4 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
        </div>
      ) : kind === 'image' && previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="" className="w-full h-full object-cover" />
      ) : kind === 'pdf' && previewUrl ? (
        <iframe
          src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
          title={`Preview ${fileName}`}
          className="w-[200%] h-[200%] origin-top-left scale-50 pointer-events-none border-0 bg-white"
        />
      ) : (
        <div
          className={cn(
            'w-full h-full flex flex-col items-center justify-center gap-0.5',
            kind === 'pdf' ? 'bg-red-50' : 'bg-neutral-100',
          )}
        >
          <FileTypeIcon kind={kind} />
          {kind === 'pdf' && (
            <span className="text-[9px] font-bold uppercase text-red-600">PDF</span>
          )}
        </div>
      )}
    </button>
  )
}

export function ProductFileRow({
  fileName,
  fileSize,
  fileType,
  storagePath,
  productId,
  fileId,
  previewUrl: localPreviewUrl,
  onRemove,
}: ProductFileRowProps) {
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [remotePreviewUrl, setRemotePreviewUrl] = useState<string | null>(null)

  const previewUrl = localPreviewUrl ?? remotePreviewUrl
  const sizeLabel = formatFileSize(fileSize)

  useEffect(() => {
    if (localPreviewUrl || !productId || !fileId || !storagePath) return

    let cancelled = false
    setPreviewLoading(true)

    fetch(`/api/products/${productId}/files/download?fileId=${encodeURIComponent(fileId)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!cancelled && data?.download_url) setRemotePreviewUrl(data.download_url)
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [localPreviewUrl, productId, fileId, storagePath])

  async function handleDownload() {
    if (!storagePath) {
      toast.error('File not available yet.')
      return
    }

    setLoading(true)
    try {
      let url: string | null = previewUrl

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

      if (isPreviewable(fileType, fileName)) {
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
      <FilePreviewThumb
        fileName={fileName}
        fileType={fileType}
        previewUrl={previewUrl}
        loading={previewLoading && !localPreviewUrl}
        onClick={storagePath ? handleDownload : undefined}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 truncate">{fileName}</p>
        {sizeLabel && <p className="text-xs text-neutral-500">{sizeLabel}</p>}
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
