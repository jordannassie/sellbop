import { fetchHomeCards } from '@/lib/resources/fetch'
import { ResourcesHomeClient } from './resources-home-client'

export const dynamic = 'force-dynamic'

export default async function ResourcesPage() {
  const cards = await fetchHomeCards()
  return <ResourcesHomeClient initialCards={cards} />
}
