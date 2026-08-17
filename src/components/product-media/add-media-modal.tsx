'use client'

import { useEffect, useState } from 'react'
import { Link2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadFile, buildStoragePath } from '@/lib/supabase/storage'
import { useAuth } from '@/context/auth-context'
import { MAX_COVER_IMAGE_SIZE_BYTES } from '@/lib/platform-config'
import { parseVideoLink } from '@/lib/product-media/video-url'
import type { PendingProductMediaItem, ProductMediaItem } from '@/lib/product-media/types'

interface AddMediaModalProps {
  open: boolean
  onClose: () => void
  onAdd: (item: Omit<PendingProductMediaItem, 'id' | 'sort_order'>) => void | Promise<void>
}

export function AddMediaModal({ open, onClose, onAdd }: AddMediaModalProps) {
  const { session } = useAuth()
  const [videoUrl, setVideoUrl] = useState('')
  const [videoError, setVideoError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [pendingImage, setPendingImage] = useState<{
    url: string
    storage_path: string | null
  } | null>(null)
  const [pendingVideo, setPendingVideo] = useState<ReturnType<typeof parseVideoLink>>(null)

  useEffect(() => {
    if (!open) {
      setVideoUrl('')
      setVideoError('')
      setPendingImage(null)
      setPendingVideo(null)
    }
  }, [open])

  useEffect(() => {
    if (!videoUrl.trim()) {
      setPendingVideo(null)
      setVideoError('')
      return
    }
    const parsed = parseVideoLink(videoUrl)
    if (!parsed) {
      setPendingVideo(null)
      setVideoError('Please enter a valid YouTube, Loom, Vimeo, or Wistia link.')
      return
    }
    setPendingVideo(parsed)
    setVideoError('')
  }, [videoUrl])

  async function handleImageUpload(file: File) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setVideoError('Please upload a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > MAX_COVER_IMAGE_SIZE_BYTES) {
      setVideoError('Image must be under 5 MB.')
      return
    }
    setUploading(true)
    setVideoError('')
    const path = buildStoragePath(session?.userId ?? 'unknown', file.name)
    const result = await uploadFile('product-images', path, file)
    setUploading(false)
    if (result.error || !result.url) {
      setVideoError(result.error ?? 'Upload failed.')
      return
    }
    setPendingImage({ url: result.url, storage_path: result.path })
    setPendingVideo(null)
    setVideoUrl('')
  }

  const canAdd = !!pendingImage || !!pendingVideo

  async function handleAdd() {
    if (!canAdd) return
    setAdding(true)
    try {
      if (pendingImage) {
        await onAdd({
          media_type: 'image',
          url: pendingImage.url,
          thumbnail_url: pendingImage.url,
          provider: 'upload',
          storage_path: pendingImage.storage_path,
        })
      } else if (pendingVideo) {
        await onAdd({
          media_type: 'video_link',
          url: pendingVideo.url,
          thumbnail_url: pendingVideo.thumbnailUrl,
          provider: pendingVideo.provider,
          embed_url: pendingVideo.embedUrl,
        })
      }
      onClose()
    } finally {
      setAdding(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close" />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h2 className="text-base font-bold text-black">Add media</h2>
          <button type="button" onClick={onClose} className="p-1 text-neutral-400 hover:text-black">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          <div>
            <p className="text-sm font-semibold text-black mb-1">Upload an image</p>
            <p className="text-xs text-neutral-500 mb-3">
              JPG, PNG, or WebP. SellBop will automatically fit your image to the product gallery.
            </p>
            <label className="inline-flex cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleImageUpload(file)
                  e.target.value = ''
                }}
              />
              <span className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-neutral-50">
                <Upload size={14} />
                {uploading ? 'Uploading…' : 'Upload Image'}
              </span>
            </label>
            {pendingImage && (
              <p className="text-xs text-emerald-600 mt-2">Image ready to add.</p>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-black mb-2">Or, add a video.</p>
            <div className="relative">
              <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="url"
                value={videoUrl}
                onChange={e => {
                  setVideoUrl(e.target.value)
                  setPendingImage(null)
                }}
                placeholder="YouTube, Loom, Vimeo, or Wistia link"
                className="w-full rounded-xl border border-neutral-200 py-2.5 pl-9 pr-3 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            {videoError && <p className="text-xs text-red-600 mt-1.5">{videoError}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-neutral-100">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={!canAdd || adding} onClick={handleAdd}>
            {adding ? 'Adding…' : 'Add'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export type GalleryMediaItem = ProductMediaItem | PendingProductMediaItem
