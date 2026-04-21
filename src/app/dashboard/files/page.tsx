'use client'
import { useState, useEffect } from 'react'
import { demoFileRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { formatBytes, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import {
  FileDown, Trash2, File, FileText, Archive,
  Film, Music, Image, FileCode,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { FileAsset } from '@/lib/domain/entities'

// ── File type → icon + subtle bg colour ──────────────────────
const FILE_TYPE_CONFIG: Record<string, {
  icon: React.ReactNode
  bg: string
  text: string
  label: string
}> = {
  pdf:   { icon: <FileText size={14} />,  bg: 'bg-red-50',     text: 'text-red-500',     label: 'PDF'   },
  zip:   { icon: <Archive size={14} />,   bg: 'bg-neutral-100', text: 'text-neutral-500', label: 'ZIP'   },
  video: { icon: <Film size={14} />,      bg: 'bg-blue-50',    text: 'text-blue-500',    label: 'Video' },
  audio: { icon: <Music size={14} />,     bg: 'bg-violet-50',  text: 'text-violet-500',  label: 'Audio' },
  image: { icon: <Image size={14} />,     bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Image' },
  code:  { icon: <FileCode size={14} />,  bg: 'bg-amber-50',   text: 'text-amber-600',   label: 'Code'  },
  other: { icon: <File size={14} />,      bg: 'bg-neutral-100', text: 'text-neutral-400', label: 'File'  },
}

function FileTypeIcon({ fileType }: { fileType: string }) {
  const cfg = FILE_TYPE_CONFIG[fileType] ?? FILE_TYPE_CONFIG.other
  return (
    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', cfg.bg, cfg.text)}>
      {cfg.icon}
    </div>
  )
}

function FileTypeBadge({ fileType }: { fileType: string }) {
  const cfg = FILE_TYPE_CONFIG[fileType] ?? FILE_TYPE_CONFIG.other
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide border',
      cfg.bg, cfg.text,
      fileType === 'zip' || fileType === 'other'
        ? 'border-neutral-200'
        : fileType === 'pdf'  ? 'border-red-100'
        : fileType === 'video' ? 'border-blue-100'
        : fileType === 'audio' ? 'border-violet-100'
        : fileType === 'image' ? 'border-emerald-100'
        : 'border-amber-100',
    )}>
      {cfg.label}
    </span>
  )
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileAsset[]>([])

  useEffect(() => { demoFileRepo.findBySellerId(DEMO_SELLER_PROFILE.id).then(setFiles) }, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this file?')) return
    await demoFileRepo.delete(id)
    setFiles(prev => prev.filter(f => f.id !== id))
    toast.success('File deleted.')
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Files</h1>
          <p className="text-neutral-500 text-sm mt-1">
            {files.length} {files.length === 1 ? 'asset' : 'assets'} · {formatBytes(files.reduce((s, f) => s + f.fileSize, 0))} total
          </p>
        </div>
        <Button variant="secondary" onClick={() => alert('Demo: File upload to Supabase Storage when live.')}>
          Upload File
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>All Files</CardTitle></CardHeader>
        <CardContent className="p-0">
          {files.length === 0 ? (
            <EmptyState
              icon={<FileDown size={32} />}
              title="No files yet"
              description="Upload files to link to your products."
            />
          ) : (
            <div className="divide-y divide-neutral-100">
              {files.map(f => (
                <div
                  key={f.id}
                  className="px-6 py-3.5 flex items-center gap-3.5 hover:bg-neutral-50 transition-colors group"
                >
                  <FileTypeIcon fileType={f.fileType} />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{f.fileName}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {formatBytes(f.fileSize)} · {f.downloadCount} {f.downloadCount === 1 ? 'download' : 'downloads'} · {formatDate(f.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <FileTypeBadge fileType={f.fileType} />
                    <button
                      onClick={() => handleDelete(f.id)}
                      title="Delete file"
                      className="text-neutral-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
