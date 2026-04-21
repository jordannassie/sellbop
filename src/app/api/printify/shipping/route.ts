// ============================================================
// POST /api/printify/shipping
// Calculates a shipping quote from Printify.
//
// Body: {
//   printifyProductId: string
//   printifyVariantId: number
//   quantity: number
//   address: PrintifyAddress
//   shopId?: string  (override)
// }
//
// Returns: { shippingCents, methodId, carrier, estimatedDays, demo }
// Falls back to demo estimate if no token is available.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server'
import {
  getTokenFromRequest,
  getShopIdFromRequest,
  hasTokenFromRequest,
  calculateShipping,
} from '@/lib/printify/client'
import type { PrintifyAddress } from '@/lib/printify/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      printifyProductId: string
      printifyVariantId: number
      quantity: number
      address: PrintifyAddress
      shopId?: string
    }

    const { printifyProductId, printifyVariantId, quantity, address, shopId: bodyShopId } = body

    if (!printifyProductId || !printifyVariantId || !address) {
      return NextResponse.json(
        { error: 'printifyProductId, printifyVariantId, and address are required' },
        { status: 400 },
      )
    }

    // Demo/mock fallback when no real token is available
    if (!hasTokenFromRequest(req)) {
      return NextResponse.json({
        shippingCents: 499,
        methodId: 1,
        carrier: 'Standard Shipping',
        estimatedDays: '5–7 business days',
        demo: true,
        message: 'Demo shipping estimate — connect your Printify account for real rates.',
      })
    }

    const token  = getTokenFromRequest(req)!
    const shopId = getShopIdFromRequest(req, bodyShopId)

    if (!shopId) {
      return NextResponse.json({ error: 'No Printify shop selected.' }, { status: 400 })
    }

    const methods = await calculateShipping(token, shopId, {
      line_items: [
        {
          product_id: printifyProductId,
          variant_id: printifyVariantId,
          quantity: quantity ?? 1,
        },
      ],
      address_to: address,
    })

    if (!methods || methods.length === 0) {
      return NextResponse.json(
        { error: 'No shipping methods available for this address.' },
        { status: 422 },
      )
    }

    // Return the cheapest method (Standard) as default
    const cheapest = methods.reduce((a, b) => (a.price <= b.price ? a : b))

    return NextResponse.json({
      shippingCents: cheapest.price,
      methodId: cheapest.method_id,
      carrier: cheapest.method_title,
      estimatedDays: null,
      demo: false,
      allMethods: methods,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
