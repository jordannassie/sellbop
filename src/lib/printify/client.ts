// ============================================================
// Printify server-side API client
// IMPORTANT: Never import this from client components.
//
// Token resolution priority (per request):
//   1. pfy_demo_token cookie  (set by /api/printify/connect)
//   2. PRINTIFY_API_TOKEN env var
//   3. null → caller falls back to mock/demo mode
//
// Shop ID resolution:
//   1. pfy_demo_shop cookie
//   2. PRINTIFY_SHOP_ID env var
//   3. null
// ============================================================

import type { NextRequest } from 'next/server'
import type {
  PrintifyShop,
  PrintifyProduct,
  PrintifyProductsPage,
  PrintifyOrderPayload,
  PrintifyOrderResponse,
  PrintifyShippingRequest,
  PrintifyShippingResponse,
} from './types'

const BASE_URL = 'https://api.printify.com/v1'

export const COOKIE_TOKEN = 'pfy_demo_token'
export const COOKIE_SHOP  = 'pfy_demo_shop'

// ── Token/Shop resolution ─────────────────────────────────────

/** Returns the active token from a request cookie or env var, or null. */
export function getTokenFromRequest(req: NextRequest): string | null {
  return req.cookies.get(COOKIE_TOKEN)?.value || process.env.PRINTIFY_API_TOKEN || null
}

/** Returns the active shop ID from a request cookie or env var, or null. */
export function getShopIdFromRequest(req: NextRequest, override?: string | null): string | null {
  if (override) return override
  return req.cookies.get(COOKIE_SHOP)?.value || process.env.PRINTIFY_SHOP_ID || null
}

/** True if any token is available (cookie or env). */
export function hasTokenFromRequest(req: NextRequest): boolean {
  return Boolean(getTokenFromRequest(req))
}

/** True only for env-var token (used as fallback in non-request contexts). */
export function hasPrintifyToken(): boolean {
  return Boolean(process.env.PRINTIFY_API_TOKEN)
}

// ── Core fetch helpers ────────────────────────────────────────

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'SellBop/1.0',
  }
}

export async function fetchShops(token: string): Promise<PrintifyShop[]> {
  const res = await fetch(`${BASE_URL}/shops.json`, {
    headers: authHeaders(token),
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Printify /shops error ${res.status}: ${body}`)
  }
  return res.json()
}

export async function fetchProducts(
  token: string,
  shopId: string | number,
  page = 1,
  limit = 20,
): Promise<PrintifyProductsPage> {
  const url = `${BASE_URL}/shops/${shopId}/products.json?page=${page}&limit=${limit}`
  const res = await fetch(url, {
    headers: authHeaders(token),
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Printify /products error ${res.status}: ${body}`)
  }
  return res.json()
}

export async function fetchProduct(
  token: string,
  shopId: string | number,
  productId: string,
): Promise<PrintifyProduct> {
  const url = `${BASE_URL}/shops/${shopId}/products/${productId}.json`
  const res = await fetch(url, {
    headers: authHeaders(token),
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Printify /product error ${res.status}: ${body}`)
  }
  return res.json()
}

export async function calculateShipping(
  token: string,
  shopId: string | number,
  payload: PrintifyShippingRequest,
): Promise<PrintifyShippingResponse> {
  const url = `${BASE_URL}/shops/${shopId}/orders/shipping.json`
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Printify /shipping error ${res.status}: ${body}`)
  }
  return res.json()
}

export async function createPrintifyOrder(
  token: string,
  shopId: string | number,
  payload: PrintifyOrderPayload,
): Promise<PrintifyOrderResponse> {
  const url = `${BASE_URL}/shops/${shopId}/orders.json`
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Printify /orders error ${res.status}: ${body}`)
  }
  return res.json()
}
