// ============================================================
// Mock Printify data — used when PRINTIFY_API_TOKEN is not set
// Lets the demo flow work without a real account
// ============================================================

import type { PrintifyShop, PrintifyProduct, PrintifyProductsPage } from './types'

export const MOCK_SHOPS: PrintifyShop[] = [
  { id: 99001, title: 'SellBop Demo Shop', sales_channel: 'custom' },
]

const makeMockProduct = (
  id: string,
  title: string,
  description: string,
  tags: string[],
  priceInCents: number,
  imageUrl: string | null,
): PrintifyProduct => ({
  id,
  title,
  description,
  tags,
  images: imageUrl
    ? [{ src: imageUrl, variant_ids: [1, 2, 3], position: 'front', is_default: true }]
    : [],
  variants: [
    { id: 1, price: priceInCents, is_enabled: true, is_default: true, title: 'S', sku: `${id}-S`, grams: 200, options: [1] },
    { id: 2, price: priceInCents, is_enabled: true, is_default: false, title: 'M', sku: `${id}-M`, grams: 220, options: [2] },
    { id: 3, price: priceInCents, is_enabled: true, is_default: false, title: 'L', sku: `${id}-L`, grams: 240, options: [3] },
    { id: 4, price: priceInCents + 200, is_enabled: true, is_default: false, title: 'XL', sku: `${id}-XL`, grams: 260, options: [4] },
  ],
  options: [
    {
      id: 1,
      name: 'Sizes',
      type: 'size',
      values: [
        { id: 1, title: 'S' },
        { id: 2, title: 'M' },
        { id: 3, title: 'L' },
        { id: 4, title: 'XL' },
      ],
    },
  ],
  print_provider_id: 99,
  blueprint_id: 5,
  is_locked: false,
  visible: true,
  is_printify_express: false,
  created_at: '2025-01-15T10:00:00Z',
  updated_at: '2025-03-01T10:00:00Z',
})

export const MOCK_PRODUCTS: PrintifyProduct[] = [
  makeMockProduct(
    'mock-tshirt-001',
    'Classic Creator Tee',
    'A premium unisex heavyweight t-shirt made from 100% ring-spun cotton. Perfect for everyday wear.',
    ['t-shirt', 'clothing', 'unisex'],
    2499,
    null,
  ),
  makeMockProduct(
    'mock-hoodie-001',
    'Signature Pullover Hoodie',
    'Ultra-soft 80% cotton / 20% polyester blend hoodie. Kangaroo pocket, adjustable drawstring.',
    ['hoodie', 'clothing', 'unisex'],
    4999,
    null,
  ),
  makeMockProduct(
    'mock-totebag-001',
    'Everyday Canvas Tote',
    'Heavy-duty canvas tote bag with reinforced handles. 15" x 16" — perfect for groceries, gear, or merch.',
    ['tote', 'bag', 'accessories'],
    1999,
    null,
  ),
  makeMockProduct(
    'mock-cap-001',
    'Dad Cap — Embroidered',
    'Six-panel unstructured cotton cap with a curved brim. One size fits most.',
    ['hat', 'cap', 'accessories'],
    2799,
    null,
  ),
]

export const MOCK_PRODUCTS_PAGE: PrintifyProductsPage = {
  current_page: 1,
  data: MOCK_PRODUCTS,
  total: MOCK_PRODUCTS.length,
  last_page: 1,
}
