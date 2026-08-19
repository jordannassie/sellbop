import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Private Preview — SellBop',
}

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return children
}
