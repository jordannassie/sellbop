import { PurchaseAccessPageClient } from './purchase-access-page-client'

export default async function PurchaseAccessPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return <PurchaseAccessPageClient token={token} />
}
