import 'server-only'

import { isSupabaseAdminConfigured } from '@/lib/env'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { cached, cacheKey, CACHE_TTL } from '../cache'
import type { SellBopSignal } from './legacy-types'
import { UNAVAILABLE_SELLBOP } from './legacy-types'

/** Minimum paid order observations before surfacing conversion intelligence. */
export const SELLBOP_MIN_SAMPLE = 20

export async function fetchSellBopSignal(category: string): Promise<SellBopSignal> {
  if (!isSupabaseAdminConfigured() || !category.trim()) {
    return { ...UNAVAILABLE_SELLBOP }
  }

  return cached(cacheKey('sellbop-category', [category]), CACHE_TTL.sellbop, async () => {
    try {
      const supabase = getSupabaseAdminClient()

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, price_cents')
        .eq('category', category.trim())
        .eq('is_live', true)

      if (productsError || !products?.length) {
        return { ...UNAVAILABLE_SELLBOP }
      }

      const productIds = products.map(p => p.id)
      const { data: orderItemsRaw, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id, unit_price_cents, order_id')
        .in('product_id', productIds)

      if (itemsError || !orderItemsRaw?.length) {
        return {
          ...UNAVAILABLE_SELLBOP,
          categoryProductCount: products.length,
          sampleSize: 0,
        }
      }

      const orderIds = [...new Set(orderItemsRaw.map(i => i.order_id))]
      const { data: paidOrders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .in('id', orderIds)
        .eq('payment_status', 'paid')

      if (ordersError) {
        return { ...UNAVAILABLE_SELLBOP, categoryProductCount: products.length }
      }

      const paidOrderIds = new Set((paidOrders ?? []).map(o => o.id))
      const orderItems = orderItemsRaw.filter(i => paidOrderIds.has(i.order_id))

      if (!orderItems.length || orderItems.length < SELLBOP_MIN_SAMPLE) {
        return {
          ...UNAVAILABLE_SELLBOP,
          categoryProductCount: products.length,
          sampleSize: orderItems?.length ?? 0,
        }
      }

      const prices = orderItems
        .map(i => i.unit_price_cents)
        .filter((p): p is number => typeof p === 'number' && p > 0)
        .sort((a, b) => a - b)

      const medianPriceCents = prices.length > 0
        ? prices[Math.floor(prices.length / 2)]
        : null

      const uniqueProductsSold = new Set(orderItems.map(i => i.product_id)).size
      const demandScore = Math.min(100, Math.round(
        (Math.log10(orderItems.length + 1) / 3) * 50
        + (uniqueProductsSold / Math.max(products.length, 1)) * 50,
      ))

      return {
        available: true,
        demandScore,
        sampleSize: orderItems.length,
        medianPriceCents,
        categoryProductCount: products.length,
        summary: `Based on ${orderItems.length} anonymized paid orders across ${uniqueProductsSold} products in "${category}".`,
      }
    } catch (err) {
      console.error('[SellBop provider]', err)
      return { ...UNAVAILABLE_SELLBOP }
    }
  })
}
