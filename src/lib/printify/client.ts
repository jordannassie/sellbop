// ============================================================
// Printify server-side API client
// IMPORTANT: Never import this from client components.
// Token is read from env — never exposed to the browser.
// ============================================================

import type {
  PrintifyShop,
  PrintifyProduct,
  PrintifyProductsPage,
  PrintifyOrderPayload,
  PrintifyOrderResponse,
} from './types'

const BASE_URL = 'https://api.printify.com/v1'

function getToken(): string {
  const token = process.env.PRINTIFY_API_TOKEN
  if (!token) throw new Error('PRINTIFY_API_TOKEN is not configured.')
  return token
}

function authHeaders() {
  return {
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
    'User-Agent': 'SellBop/1.0',
  }
}

export function hasPrintifyToken(): boolean {
  return Boolean(process.env.PRINTIFY_API_TOKEN)
}

export async function fetchShops(): Promise<PrintifyShop[]> {
  const res = await fetch(`${BASE_URL}/shops.json`, {
    headers: authHeaders(),
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Printify /shops error ${res.status}: ${body}`)
  }
  return res.json()
}

export async function fetchProducts(
  shopId: string | number,
  page = 1,
  limit = 20,
): Promise<PrintifyProductsPage> {
  const url = `${BASE_URL}/shops/${shopId}/products.json?page=${page}&limit=${limit}`
  const res = await fetch(url, {
    headers: authHeaders(),
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Printify /products error ${res.status}: ${body}`)
  }
  return res.json()
}

export async function fetchProduct(
  shopId: string | number,
  productId: string,
): Promise<PrintifyProduct> {
  const url = `${BASE_URL}/shops/${shopId}/products/${productId}.json`
  const res = await fetch(url, {
    headers: authHeaders(),
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Printify /product error ${res.status}: ${body}`)
  }
  return res.json()
}

export async function createPrintifyOrder(
  shopId: string | number,
  payload: PrintifyOrderPayload,
): Promise<PrintifyOrderResponse> {
  const url = `${BASE_URL}/shops/${shopId}/orders.json`
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Printify /orders error ${res.status}: ${body}`)
  }
  return res.json()
}
