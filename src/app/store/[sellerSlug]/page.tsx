import { redirect } from 'next/navigation'

// Permanent redirect: /store/[sellerSlug] → /[sellerSlug]
export default async function StoreRedirectPage({
  params,
}: {
  params: Promise<{ sellerSlug: string }>
}) {
  const { sellerSlug } = await params
  redirect(`/${sellerSlug}`)
}
