import { redirect } from 'next/navigation'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ claim?: string }>
}) {
  const { claim } = await searchParams
  if (claim?.trim()) {
    redirect(`/login?mode=signup&redirect=${encodeURIComponent(`/partner/claim/${claim.trim()}`)}`)
  }
  redirect('/login?mode=signup')
}
