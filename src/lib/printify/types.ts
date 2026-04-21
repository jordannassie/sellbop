// ============================================================
// Printify API types — server-side use only
// ============================================================

export interface PrintifyShop {
  id: number
  title: string
  sales_channel: string
}

export interface PrintifyVariant {
  id: number
  price: number        // in cents (integer — e.g. 2499 = $24.99)
  is_enabled: boolean
  is_default: boolean
  title: string        // e.g. "Black / M" or just "M"
  sku: string
  grams: number
  options: number[]    // array of option value IDs
}

export interface PrintifyImage {
  src: string
  variant_ids: number[]  // which variant IDs this image belongs to
  position: string
  is_default: boolean
}

export interface PrintifyOptionValue {
  id: number
  title: string
  colors?: string[]   // hex colors if type === 'color'
}

export interface PrintifyOption {
  id: number
  name: string        // e.g. "Colors", "Sizes"
  type: string        // e.g. "color", "size", "style"
  values: PrintifyOptionValue[]
}

export interface PrintifyProduct {
  id: string
  title: string
  description: string
  tags: string[]
  images: PrintifyImage[]
  variants: PrintifyVariant[]
  options: PrintifyOption[]
  print_provider_id: number
  blueprint_id: number
  is_locked: boolean
  visible: boolean
  is_printify_express: boolean
  created_at: string
  updated_at: string
}

export interface PrintifyProductsPage {
  current_page: number
  data: PrintifyProduct[]
  total: number
  last_page: number
}

export interface PrintifyAddress {
  first_name: string
  last_name: string
  email: string
  phone?: string
  country: string
  region: string
  address1: string
  address2?: string
  city: string
  zip: string
}

export interface PrintifyLineItem {
  product_id: string
  variant_id: number
  quantity: number
}

export interface PrintifyOrderPayload {
  label: string
  line_items: PrintifyLineItem[]
  shipping_method: number
  send_shipping_notification: boolean
  address_to: PrintifyAddress
}

export interface PrintifyOrderResponse {
  id: string
  status: string
  address_to: PrintifyAddress
  line_items: PrintifyLineItem[]
  created_at: string
}

// ── Shipping calculation ──────────────────────────────────────

export interface PrintifyShippingRequest {
  line_items: PrintifyLineItem[]
  address_to: PrintifyAddress
}

export interface PrintifyShippingMethod {
  method_id: number
  method_title: string
  price: number   // in cents
  currency: string
}

export type PrintifyShippingResponse = PrintifyShippingMethod[]
