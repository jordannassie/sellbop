// ============================================================
// POST /api/printify/order
// Sends a SellBop order to Printify for fulfillment.
// Uses session cookie token → env token → demo stub.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server'
import { getTokenFromRequest, getShopIdFromRequest, hasTokenFromRequest, createPrintifyOrder } from '@/lib/printify/client'
import type { PrintifyOrderPayload } from '@/lib/printify/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { shopId: bodyShopId, payload } = body as { shopId?: string; payload: PrintifyOrderPayload }

    if (!payload) {
      return NextResponse.json({ error: 'payload is required' }, { status: 400 })
    }

    if (!hasTokenFromRequest(req)) {
      // Demo stub — no real token available
      const stubOrderId = `DEMO-${Date.now()}`
      return NextResponse.json({
        printifyOrderId: stubOrderId,
        status: 'sent_to_printify',
        demo: true,
        message: 'Demo order stub — connect your Printify account to send real orders.',
      })
    }

    const token  = getTokenFromRequest(req)!
    const shopId = getShopIdFromRequest(req, bodyShopId)

    if (!shopId) {
      return NextResponse.json({ error: 'No shop selected.' }, { status: 400 })
    }

    const result = await createPrintifyOrder(token, shopId, payload)
    return NextResponse.json({
      printifyOrderId: result.id,
      status: 'sent_to_printify',
      demo: false,
      raw: result,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
