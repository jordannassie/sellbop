'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface DropUploadZoneProps {
  onFile: (file: File) => void
  accept?: string
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

export function DropUploadZone({
  onFile,
  accept,
  disabled = false,
  className,
  children,
}: DropUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function pickFile(file: File | undefined) {
    if (!file || disabled) return
    onFile(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    pickFile(e.dataTransfer.files?.[0])
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => {
          e.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        disabled={disabled}
        className={cn(
          'rounded-xl border-2 border-dashed transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60',
          dragging
            ? 'border-black bg-neutral-100'
            : 'border-neutral-200 bg-neutral-50 hover:border-neutral-400 hover:bg-neutral-100',
          className,
        )}
      >
        {children}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={e => pickFile(e.target.files?.[0])}
      />
    </>
  )
}
