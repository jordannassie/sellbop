// ============================================================
// POST /api/printify/order
// Sends a SellBop order to Printify for fulfillment.
// When no real token is present, returns a stubbed response.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server'
import { hasPrintifyToken, createPrintifyOrder } from '@/lib/printify/client'
import type { PrintifyOrderPayload } from '@/lib/printify/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { shopId, payload } = body as { shopId: string; payload: PrintifyOrderPayload }

    if (!shopId || !payload) {
      return NextResponse.json({ error: 'shopId and payload are required' }, { status: 400 })
    }

    if (!hasPrintifyToken()) {
      // Demo stub — pretend the order was accepted
      const stubOrderId = `DEMO-${Date.now()}`
      return NextResponse.json({
        printifyOrderId: stubOrderId,
        status: 'sent_to_printify',
        demo: true,
        message: 'Demo order stub — no real Printify token configured.',
      })
    }

    const result = await createPrintifyOrder(shopId, payload)
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
