import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/context/auth-context'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'SellBop.com — Sell anything in minutes',
  description: 'Create one simple page for your product or offer and start getting paid. SellBop.com',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-neutral-900 antialiased">
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  )
}
