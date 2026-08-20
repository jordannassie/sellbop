// MCP tool registrations — handler types are inferred by mcp-handler at runtime.
// @ts-nocheck
import type { AuthInfo } from '@modelcontextprotocol/server'
import { z } from 'zod'
import { AgentAuthError, type AgentIdentity } from './auth'
import {
  getStore, getProducts, getProduct, createProduct, updateProduct,
  setProductDescription, setProductPrice, uploadProductFile, attachProductFile,
  uploadProductImage, setPrimaryProductImage, enableAffiliates, disableAffiliates,
  setAffiliateCommission, saveProductAsDraft, publishProduct, unpublishProduct,
} from './service'
import {
  listShops, getShop, getShopBySlug, createShop, updateShop,
  setShopAvatar, setShopBanner, getStorefrontConfiguration, getShopPreviewUrl,
  auditShop, getShopSnapshot,
} from './shop-service'
import {
  reorderProducts, duplicateProduct, listProductFiles, setProductSalePrice, addProductGalleryImage,
} from './catalog-service'
import { getShopSalesSummary, getProductSalesSummary } from './analytics-service'
import { generateProductImage, generateShopBanner, generateProductPdf } from '@/lib/creative'

function identityOf(ctx: { http?: { authInfo?: AuthInfo } }): AgentIdentity {
  const identity = ctx.http?.authInfo?.extra?.identity as AgentIdentity | undefined
  if (!identity) throw new AgentAuthError('Missing or invalid SellBop agent token.', 401)
  return identity
}

function textResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
}

function errorResult(err: unknown) {
  const message = err instanceof Error ? err.message : 'Unknown error.'
  return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true }
}

async function tool<T>(fn: () => Promise<T>) {
  try {
    return textResult(await fn())
  } catch (err) {
    return errorResult(err)
  }
}

export function registerSellBopMcpTools(server) {
  // ── Legacy + shop discovery ───────────────────────────────────────────────
  server.registerTool('get_store', { title: 'Get Store', description: 'Get the connected seller store (legacy). Use get_shop for shop-aware access.', inputSchema: z.object({ shop_id: z.string().optional() }) }, async (args, ctx) => tool(() => getStore(identityOf(ctx), args.shop_id)))
  server.registerTool('list_shops', { title: 'List Shops', description: 'List shops this connection can manage.', inputSchema: z.object({}) }, async (_a, ctx) => tool(() => listShops(identityOf(ctx))))
  server.registerTool('get_shop', { title: 'Get Shop', description: 'Get shop details by ID.', inputSchema: z.object({ shop_id: z.string().optional() }) }, async (args, ctx) => tool(() => getShop(identityOf(ctx), args.shop_id)))
  server.registerTool('get_shop_by_slug', { title: 'Get Shop By Slug', description: 'Get shop by URL slug.', inputSchema: z.object({ slug: z.string() }) }, async (args, ctx) => tool(() => getShopBySlug(identityOf(ctx), args.slug)))
  server.registerTool('create_shop', { title: 'Create Shop', description: 'Create a normal or Partner shop (admin only for Partner). Always starts draft-ready.', inputSchema: z.object({ name: z.string(), slug: z.string().optional(), bio: z.string().nullable().optional(), support_email: z.string().nullable().optional(), partner_mode: z.boolean().optional(), partner_name: z.string().nullable().optional(), partner_email: z.string().nullable().optional() }) }, async (args, ctx) => tool(() => createShop(identityOf(ctx), args)))
  server.registerTool('update_shop', { title: 'Update Shop', description: 'Update shop identity and branding fields.', inputSchema: z.object({ shop_id: z.string().optional(), name: z.string().optional(), bio: z.string().nullable().optional(), headline: z.string().nullable().optional(), support_email: z.string().nullable().optional(), social_links: z.record(z.string(), z.string()).nullable().optional(), layout_mode: z.string().nullable().optional(), branding_mode: z.string().nullable().optional() }) }, async ({ shop_id, ...patch }: { shop_id?: string; name?: string; bio?: string | null; headline?: string | null; support_email?: string | null; social_links?: Record<string, string> | null; layout_mode?: string | null; branding_mode?: string | null }, ctx) => tool(() => updateShop(identityOf(ctx), shop_id, patch)))
  server.registerTool('set_shop_avatar', { title: 'Set Shop Avatar', description: 'Upload shop avatar image (base64).', inputSchema: z.object({ shop_id: z.string().optional(), file_name: z.string(), mime_type: z.string(), base64_data: z.string() }) }, async ({ shop_id, file_name, mime_type, base64_data }, ctx) => tool(() => setShopAvatar(identityOf(ctx), shop_id, { fileName: file_name, mimeType: mime_type, base64Data: base64_data })))
  server.registerTool('set_shop_banner', { title: 'Set Shop Banner', description: 'Upload shop banner image (base64).', inputSchema: z.object({ shop_id: z.string().optional(), file_name: z.string(), mime_type: z.string(), base64_data: z.string() }) }, async ({ shop_id, file_name, mime_type, base64_data }, ctx) => tool(() => setShopBanner(identityOf(ctx), shop_id, { fileName: file_name, mimeType: mime_type, base64Data: base64_data })))
  server.registerTool('get_storefront_configuration', { title: 'Get Storefront Configuration', description: 'Get storefront layout and presentation config.', inputSchema: z.object({ shop_id: z.string().optional() }) }, async (args, ctx) => tool(() => getStorefrontConfiguration(identityOf(ctx), args.shop_id)))
  server.registerTool('get_shop_preview_url', { title: 'Get Shop Preview URL', description: 'Get private preview or public storefront URL.', inputSchema: z.object({ shop_id: z.string().optional() }) }, async (args, ctx) => tool(() => getShopPreviewUrl(identityOf(ctx), args.shop_id)))
  server.registerTool('audit_shop', { title: 'Audit Shop', description: 'Deterministic shop readiness audit.', inputSchema: z.object({ shop_id: z.string().optional() }) }, async (args, ctx) => tool(() => auditShop(identityOf(ctx), args.shop_id)))
  server.registerTool('get_shop_snapshot', { title: 'Get Shop Snapshot', description: 'Full structured shop context in one call.', inputSchema: z.object({ shop_id: z.string().optional() }) }, async (args, ctx) => tool(() => getShopSnapshot(identityOf(ctx), args.shop_id)))

  // ── Products ──────────────────────────────────────────────────────────────
  server.registerTool('get_products', { title: 'Get Products', description: 'List products for a shop.', inputSchema: z.object({ shop_id: z.string().optional() }) }, async (args, ctx) => tool(() => getProducts(identityOf(ctx), args.shop_id)))
  server.registerTool('list_products', { title: 'List Products', description: 'Alias for get_products.', inputSchema: z.object({ shop_id: z.string().optional() }) }, async (args, ctx) => tool(() => getProducts(identityOf(ctx), args.shop_id)))
  server.registerTool('get_product', { title: 'Get Product', description: 'Get product with files.', inputSchema: z.object({ product_id: z.string(), shop_id: z.string().optional() }) }, async (args, ctx) => tool(() => getProduct(identityOf(ctx), args.product_id, args.shop_id)))
  server.registerTool('create_product', { title: 'Create Product', description: 'Create draft product by default.', inputSchema: z.object({ shop_id: z.string().optional(), title: z.string(), description: z.string().nullable().optional(), short_description: z.string().nullable().optional(), price_cents: z.number().int().min(0).optional(), cover_image_url: z.string().nullable().optional(), slug: z.string().nullable().optional(), category: z.string().nullable().optional(), is_live: z.boolean().optional(), marketplace_listing: z.boolean().optional(), affiliate_enabled: z.boolean().optional(), affiliate_commission_percent: z.number().int().min(0).max(100).nullable().optional() }) }, async (args, ctx) => tool(() => createProduct(identityOf(ctx), args)))
  server.registerTool('update_product', { title: 'Update Product', description: 'Update product fields.', inputSchema: z.object({ product_id: z.string(), shop_id: z.string().optional(), title: z.string().optional(), slug: z.string().optional(), description: z.string().nullable().optional(), short_description: z.string().nullable().optional(), price_cents: z.number().int().min(0).optional(), cover_image_url: z.string().nullable().optional(), is_live: z.boolean().optional(), category: z.string().nullable().optional(), marketplace_listing: z.boolean().optional(), affiliate_enabled: z.boolean().optional(), affiliate_commission_percent: z.number().int().min(0).max(100).nullable().optional(), access_message: z.string().nullable().optional(), checkout_copy: z.string().nullable().optional(), sale_enabled: z.boolean().optional(), sale_price_cents: z.number().int().min(0).nullable().optional() }) }, async ({ product_id, shop_id, ...patch }, ctx) => tool(() => updateProduct(identityOf(ctx), product_id, patch, shop_id)))
  server.registerTool('set_product_description', { title: 'Set Product Description', description: 'Update product description.', inputSchema: z.object({ product_id: z.string(), description: z.string() }) }, async (args, ctx) => tool(() => setProductDescription(identityOf(ctx), args.product_id, args.description)))
  server.registerTool('set_product_price', { title: 'Set Product Price', description: 'Set price in cents.', inputSchema: z.object({ product_id: z.string(), price_cents: z.number().int().min(0) }) }, async (args, ctx) => tool(() => setProductPrice(identityOf(ctx), args.product_id, args.price_cents)))
  server.registerTool('set_product_sale_price', { title: 'Set Product Sale Price', description: 'Enable sale pricing.', inputSchema: z.object({ product_id: z.string(), sale_price_cents: z.number().int().min(0), enabled: z.boolean().optional(), shop_id: z.string().optional() }) }, async (args, ctx) => tool(() => setProductSalePrice(identityOf(ctx), args.product_id, args.sale_price_cents, args.enabled ?? true, args.shop_id)))
  server.registerTool('reorder_products', { title: 'Reorder Products', description: 'Set catalog sort order.', inputSchema: z.object({ shop_id: z.string().optional(), ordered_product_ids: z.array(z.string()) }) }, async (args, ctx) => tool(() => reorderProducts(identityOf(ctx), args.shop_id, args.ordered_product_ids)))
  server.registerTool('duplicate_product', { title: 'Duplicate Product', description: 'Duplicate as draft.', inputSchema: z.object({ product_id: z.string(), shop_id: z.string().optional() }) }, async (args, ctx) => tool(() => duplicateProduct(identityOf(ctx), args.product_id, args.shop_id)))
  server.registerTool('list_product_files', { title: 'List Product Files', description: 'List delivery files for a product.', inputSchema: z.object({ product_id: z.string(), shop_id: z.string().optional() }) }, async (args, ctx) => tool(() => listProductFiles(identityOf(ctx), args.product_id, args.shop_id)))

  // ── Files & media ─────────────────────────────────────────────────────────
  server.registerTool('upload_product_file', { title: 'Upload Product File', description: 'Upload delivery file (base64).', inputSchema: z.object({ product_id: z.string(), file_name: z.string(), mime_type: z.string(), base64_data: z.string() }) }, async (args, ctx) => tool(() => uploadProductFile(identityOf(ctx), args.product_id, { fileName: args.file_name, mimeType: args.mime_type, base64Data: args.base64_data })))
  server.registerTool('attach_product_file', { title: 'Attach Product File', description: 'Attach existing storage file.', inputSchema: z.object({ product_id: z.string(), file_name: z.string(), mime_type: z.string(), storage_path: z.string(), file_size: z.number().int().min(0).optional() }) }, async (args, ctx) => tool(() => attachProductFile(identityOf(ctx), args.product_id, { fileName: args.file_name, fileType: args.mime_type, storagePath: args.storage_path, fileSize: args.file_size })))
  server.registerTool('upload_product_image', { title: 'Upload Product Image', description: 'Upload cover image (base64).', inputSchema: z.object({ product_id: z.string(), file_name: z.string(), mime_type: z.string(), base64_data: z.string(), set_primary: z.boolean().optional() }) }, async (args, ctx) => tool(() => uploadProductImage(identityOf(ctx), args.product_id, { fileName: args.file_name, mimeType: args.mime_type, base64Data: args.base64_data, setPrimary: args.set_primary })))
  server.registerTool('set_primary_product_image', { title: 'Set Primary Product Image', description: 'Set cover from URL.', inputSchema: z.object({ product_id: z.string(), image_url: z.string() }) }, async (args, ctx) => tool(() => setPrimaryProductImage(identityOf(ctx), args.product_id, args.image_url)))
  server.registerTool('add_product_gallery_image', { title: 'Add Product Gallery Image', description: 'Add gallery image via product_media.', inputSchema: z.object({ product_id: z.string(), file_name: z.string(), mime_type: z.string(), base64_data: z.string(), set_primary: z.boolean().optional(), shop_id: z.string().optional() }) }, async (args, ctx) => tool(() => addProductGalleryImage(identityOf(ctx), args.product_id, { fileName: args.file_name, mimeType: args.mime_type, base64Data: args.base64_data, setPrimary: args.set_primary }, args.shop_id)))

  // ── Affiliates & publish ──────────────────────────────────────────────────
  server.registerTool('enable_affiliates', { title: 'Enable Affiliates', description: 'Enable affiliate promotion.', inputSchema: z.object({ product_id: z.string(), commission_percent: z.number().int().min(0).max(100).optional() }) }, async (args, ctx) => tool(() => enableAffiliates(identityOf(ctx), args.product_id, args.commission_percent)))
  server.registerTool('disable_affiliates', { title: 'Disable Affiliates', description: 'Disable affiliate promotion.', inputSchema: z.object({ product_id: z.string() }) }, async (args, ctx) => tool(() => disableAffiliates(identityOf(ctx), args.product_id)))
  server.registerTool('set_affiliate_commission', { title: 'Set Affiliate Commission', description: 'Set commission percent.', inputSchema: z.object({ product_id: z.string(), percent: z.number().int().min(0).max(100) }) }, async (args, ctx) => tool(() => setAffiliateCommission(identityOf(ctx), args.product_id, args.percent)))
  server.registerTool('save_product_as_draft', { title: 'Save Product as Draft', description: 'Unpublish product.', inputSchema: z.object({ product_id: z.string() }) }, async (args, ctx) => tool(() => saveProductAsDraft(identityOf(ctx), args.product_id)))
  server.registerTool('publish_product', { title: 'Publish Product', description: 'Make product live.', inputSchema: z.object({ product_id: z.string() }) }, async (args, ctx) => tool(() => publishProduct(identityOf(ctx), args.product_id)))
  server.registerTool('unpublish_product', { title: 'Unpublish Product', description: 'Take product off sale.', inputSchema: z.object({ product_id: z.string() }) }, async (args, ctx) => tool(() => unpublishProduct(identityOf(ctx), args.product_id)))

  // ── Analytics ─────────────────────────────────────────────────────────────
  server.registerTool('get_shop_sales_summary', { title: 'Get Shop Sales Summary', description: 'Read-only shop sales metrics.', inputSchema: z.object({ shop_id: z.string().optional(), days: z.number().int().min(1).max(365).optional() }) }, async (args, ctx) => tool(() => getShopSalesSummary(identityOf(ctx), args.shop_id, args.days ?? 30)))
  server.registerTool('get_product_sales_summary', { title: 'Get Product Sales Summary', description: 'Read-only product sales metrics.', inputSchema: z.object({ product_id: z.string(), shop_id: z.string().optional(), days: z.number().int().min(1).max(365).optional() }) }, async (args, ctx) => tool(() => getProductSalesSummary(identityOf(ctx), args.product_id, args.shop_id, args.days ?? 30)))

  // ── Creative (provider abstraction) ───────────────────────────────────────
  server.registerTool('generate_product_image', { title: 'Generate Product Image', description: 'Generate image via configured provider.', inputSchema: z.object({ prompt: z.string(), aspect_ratio: z.enum(['1:1', '16:9', '4:3']).optional(), shop_id: z.string().optional(), product_id: z.string().optional() }) }, async (args, ctx) => tool(() => generateProductImage({ prompt: args.prompt, aspectRatio: args.aspect_ratio, shopId: args.shop_id, productId: args.product_id })))
  server.registerTool('generate_shop_banner', { title: 'Generate Shop Banner', description: 'Generate banner via configured provider.', inputSchema: z.object({ prompt: z.string(), shop_id: z.string().optional() }) }, async (args, ctx) => tool(() => generateShopBanner({ prompt: args.prompt, shopId: args.shop_id })))
  server.registerTool('generate_product_pdf', { title: 'Generate Product PDF', description: 'Generate PDF via configured provider.', inputSchema: z.object({ prompt: z.string(), title: z.string().optional(), shop_id: z.string().optional(), product_id: z.string().optional() }) }, async (args, ctx) => tool(() => generateProductPdf({ prompt: args.prompt, title: args.title, shopId: args.shop_id, productId: args.product_id })))
}
