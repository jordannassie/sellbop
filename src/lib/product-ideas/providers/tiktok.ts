import 'server-only'

import type { TikTokSignal } from './legacy-types'
import { UNAVAILABLE_TIKTOK } from './legacy-types'

/** TikTok provider stub — enable when a compliant official/licensed API exists. */
export async function fetchTikTokSignal(_keyword: string): Promise<TikTokSignal> {
  return { ...UNAVAILABLE_TIKTOK }
}
