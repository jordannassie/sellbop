'use client'
import { useState, useEffect } from 'react'
import { demoFileRepo } from '@/lib/adapters/demo/repositories'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { formatBytes, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { FileDown, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { FileAsset } from '@/lib/domain/entities'

const ICON: Record<string, string> = { pdf: '📄', zip: '📦', video: '🎬', audio: '🎵', image: '🖼️', other: '📁' }

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
          <p className="text-neutral-500 text-sm mt-1">{files.length} assets · {formatBytes(files.reduce((s, f) => s + f.fileSize, 0))} total</p>
        </div>
        <Button variant="secondary" onClick={() => alert('Demo: File upload to Supabase Storage when live.')}>Upload File</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>All Files</CardTitle></CardHeader>
        <CardContent className="p-0">
          {files.length === 0 ? (
            <EmptyState icon={<FileDown size={32} />} title="No files yet" description="Upload files to link to your products." />
          ) : (
            <div className="divide-y divide-neutral-50">
              {files.map(f => (
                <div key={f.id} className="px-6 py-3 flex items-center gap-4">
                  <span className="text-xl">{ICON[f.fileType] ?? '📁'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{f.fileName}</p>
                    <p className="text-xs text-neutral-400">{formatBytes(f.fileSize)} · {f.downloadCount} downloads · {formatDate(f.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="neutral">{f.fileType.toUpperCase()}</Badge>
                    <button onClick={() => handleDelete(f.id)} className="text-neutral-300 hover:text-red-500 transition-colors">
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
