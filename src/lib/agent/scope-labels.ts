export const SCOPE_LABELS: Record<string, { label: string; description: string }> = {
  'shops:read': { label: 'View my Shops', description: 'See shop names, branding, and configuration.' },
  'shops:write': { label: 'Edit my Shops', description: 'Update shop identity, branding, and storefront setup.' },
  'products:read': { label: 'View products', description: 'Read product listings, prices, and details.' },
  'products:write': { label: 'Create and edit products', description: 'Create products, edit copy, pricing, and publish status.' },
  'files:write': { label: 'Upload product assets', description: 'Upload images and downloadable delivery files.' },
  'affiliates:write': { label: 'Configure affiliates', description: 'Enable affiliates and set commission percentages.' },
  'analytics:read': { label: 'View sales analytics', description: 'Read shop and product sales summaries.' },
  'sales:read': { label: 'View sales data', description: 'Legacy scope — same as analytics read.' },
}

export function humanActionLabel(action: string): string {
  const map: Record<string, string> = {
    create_product: 'Created product',
    update_product: 'Updated product',
    create_shop: 'Created shop',
    update_shop: 'Updated shop',
    set_shop_avatar: 'Updated shop avatar',
    set_shop_banner: 'Updated shop banner',
    upload_product_file: 'Uploaded product file',
    upload_product_image: 'Uploaded product image',
    add_product_gallery_image: 'Added gallery image',
    enable_affiliates: 'Enabled affiliates',
    disable_affiliates: 'Disabled affiliates',
    set_affiliate_commission: 'Changed affiliate commission',
    reorder_products: 'Reordered catalog',
    duplicate_product: 'Duplicated product',
    generate_product_image: 'Generated product image',
    generate_shop_banner: 'Generated shop banner',
    generate_product_pdf: 'Generated product PDF',
    build_product_assets: 'Built product assets',
  }
  return map[action] ?? action.replace(/_/g, ' ')
}

export function accessModeLabel(mode: string | null | undefined): string {
  if (mode === 'all_managed_shops') return 'All My Shops'
  return 'Current Shop Only'
}
