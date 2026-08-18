import { Suspense } from 'react'
import SchoolPageClient from './school-page-client'

export default function SchoolPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
        </div>
      }
    >
      <SchoolPageClient />
    </Suspense>
  )
}
