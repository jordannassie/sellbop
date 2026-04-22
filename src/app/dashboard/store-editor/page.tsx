'use client'
import { Suspense } from 'react'
import { StoreEditorProvider } from '@/context/store-editor-context'
import { StoreEditorShell } from '@/components/store-editor/editor-shell'

export default function StoreEditorPage() {
  return (
    <StoreEditorProvider>
      {/* Suspense required because StoreEditorShell uses useSearchParams */}
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <StoreEditorShell />
      </Suspense>
    </StoreEditorProvider>
  )
}
