'use client'
import { StoreEditorProvider } from '@/context/store-editor-context'
import { StoreEditorShell } from '@/components/store-editor/editor-shell'

export default function StoreEditorPage() {
  return (
    <StoreEditorProvider>
      <StoreEditorShell />
    </StoreEditorProvider>
  )
}
