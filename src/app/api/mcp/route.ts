import 'server-only'

import { z } from 'zod'
import type { AuthInfo } from '@modelcontextprotocol/server'
import { createMcpHandler, withMcpAuth } from 'mcp-handler'
import { resolveAgentToken, type AgentIdentity } from '@/lib/agent/auth'
import {
  getStore,
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  setProductDescription,
  setProductPrice,
  uploadProductFile,
  attachProductFile,
  uploadProductImage,
  setPrimaryProductImage,
  enableAffiliates,
  disableAffiliates,
  setAffiliateCommission,
  saveProductAsDraft,
  publishProduct,
  unpublishProduct,
} from '@/lib/agent/service'
import { AgentAuthError } from '@/lib/agent/auth'

// ─────────────────────────────────────────────────────────────────────────
// SellBop MCP server.
//
// Every tool below is a thin wrapper over the exact same service functions
// used by /api/agent/v1/* — same ownership checks, same scope checks, same
// activity log. This file only adapts those functions to the MCP protocol.
//
// Auth: bearer token issued from Settings → AI & Integrations
// ("sk_agent_live_…"). See /AGENT-API.md for the full connection guide.
// ─────────────────────────────────────────────────────────────────────────

function identityOf(ctx: { http?: { authInfo?: AuthInfo } }): AgentIdentity {
  const identity = ctx.http?.authInfo?.extra?.identity as AgentIdentity | undefined
  if (!identity) {
    throw new AgentAuthError('Missing or invalid SellBop agent token.', 401)
  }
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

const handler = createMcpHandler((server) => {
  server.registerTool(
    'get_store',
    { title: 'Get Store', description: "Get the connected seller's SellBop store.", inputSchema: z.object({}) },
    async (_args, ctx) => tool(() => getStore(identityOf(ctx))),
  )

  server.registerTool(
    'get_products',
    { title: 'Get Products', description: "List the connected seller's products.", inputSchema: z.object({}) },
    async (_args, ctx) => tool(() => getProducts(identityOf(ctx))),
  )

  server.registerTool(
    'list_products',
    { title: 'List Products', description: "List the connected seller's products.", inputSchema: z.object({}) },
    async (_args, ctx) => tool(() => getProducts(identityOf(ctx))),
  )

  server.registerTool(
    'get_product',
    {
      title: 'Get Product',
      description: 'Get a single product by ID, including its files.',
      inputSchema: z.object({ product_id: z.string() }),
    },
    async ({ product_id }, ctx) => tool(() => getProduct(identityOf(ctx), product_id)),
  )

  server.registerTool(
    'create_product',
    {
      title: 'Create Product',
      description:
        'Create a new digital product. Always starts as a draft (is_live: false) unless is_live is explicitly set to true. Defaults to Marketplace-listed with affiliates enabled at 30% commission.',
      inputSchema: z.object({
        title: z.string(),
        description: z.string().nullable().optional(),
        short_description: z.string().nullable().optional(),
        price_cents: z.number().int().min(0).optional(),
        cover_image_url: z.string().nullable().optional(),
        slug: z.string().nullable().optional(),
        category: z.string().nullable().optional(),
        is_live: z.boolean().optional(),
        marketplace_listing: z.boolean().optional(),
        affiliate_enabled: z.boolean().optional(),
        affiliate_commission_percent: z.number().int().min(0).max(100).nullable().optional(),
      }),
    },
    async (args, ctx) => tool(() => createProduct(identityOf(ctx), args)),
  )

  server.registerTool(
    'update_product',
    {
      title: 'Update Product',
      description: 'Update any combination of fields on an existing product.',
      inputSchema: z.object({
        product_id: z.string(),
        title: z.string().optional(),
        slug: z.string().optional(),
        description: z.string().nullable().optional(),
        short_description: z.string().nullable().optional(),
        price_cents: z.number().int().min(0).optional(),
        cover_image_url: z.string().nullable().optional(),
        is_live: z.boolean().optional(),
        category: z.string().nullable().optional(),
        marketplace_listing: z.boolean().optional(),
        affiliate_enabled: z.boolean().optional(),
        affiliate_commission_percent: z.number().int().min(0).max(100).nullable().optional(),
        access_message: z.string().nullable().optional(),
        checkout_copy: z.string().nullable().optional(),
      }),
    },
    async ({ product_id, ...patch }, ctx) => tool(() => updateProduct(identityOf(ctx), product_id, patch)),
  )

  server.registerTool(
    'set_product_description',
    {
      title: 'Set Product Description',
      description: "Update a product's long description.",
      inputSchema: z.object({ product_id: z.string(), description: z.string() }),
    },
    async ({ product_id, description }, ctx) =>
      tool(() => setProductDescription(identityOf(ctx), product_id, description)),
  )

  server.registerTool(
    'set_product_price',
    {
      title: 'Set Product Price',
      description: 'Update a product price, in cents (e.g. 4900 = $49.00).',
      inputSchema: z.object({ product_id: z.string(), price_cents: z.number().int().min(0) }),
    },
    async ({ product_id, price_cents }, ctx) =>
      tool(() => setProductPrice(identityOf(ctx), product_id, price_cents)),
  )

  server.registerTool(
    'upload_product_file',
    {
      title: 'Upload Product File',
      description:
        'Upload a downloadable product file (base64-encoded bytes) to private storage and attach it to a product. Max 100 MB.',
      inputSchema: z.object({
        product_id: z.string(),
        file_name: z.string(),
        mime_type: z.string(),
        base64_data: z.string(),
      }),
    },
    async ({ product_id, file_name, mime_type, base64_data }, ctx) =>
      tool(() => uploadProductFile(identityOf(ctx), product_id, { fileName: file_name, mimeType: mime_type, base64Data: base64_data })),
  )

  server.registerTool(
    'attach_product_file',
    {
      title: 'Attach Product File',
      description: 'Register a file already uploaded to SellBop storage (by storage_path) against a product.',
      inputSchema: z.object({
        product_id: z.string(),
        file_name: z.string(),
        mime_type: z.string(),
        storage_path: z.string(),
        file_size: z.number().int().min(0).optional(),
      }),
    },
    async ({ product_id, file_name, mime_type, storage_path, file_size }, ctx) =>
      tool(() =>
        attachProductFile(identityOf(ctx), product_id, { fileName: file_name, fileType: mime_type, storagePath: storage_path, fileSize: file_size }),
      ),
  )

  server.registerTool(
    'upload_product_image',
    {
      title: 'Upload Product Image',
      description:
        'Upload a cover/promotional image (base64-encoded bytes) to public storage. Sets it as the primary image unless set_primary is false. Max 5 MB.',
      inputSchema: z.object({
        product_id: z.string(),
        file_name: z.string(),
        mime_type: z.string(),
        base64_data: z.string(),
        set_primary: z.boolean().optional(),
      }),
    },
    async ({ product_id, file_name, mime_type, base64_data, set_primary }, ctx) =>
      tool(() =>
        uploadProductImage(identityOf(ctx), product_id, {
          fileName: file_name,
          mimeType: mime_type,
          base64Data: base64_data,
          setPrimary: set_primary,
        }),
      ),
  )

  server.registerTool(
    'set_primary_product_image',
    {
      title: 'Set Primary Product Image',
      description: 'Set a product\'s cover image to an already-hosted image URL.',
      inputSchema: z.object({ product_id: z.string(), image_url: z.string() }),
    },
    async ({ product_id, image_url }, ctx) =>
      tool(() => setPrimaryProductImage(identityOf(ctx), product_id, image_url)),
  )

  server.registerTool(
    'enable_affiliates',
    {
      title: 'Enable Affiliates',
      description: 'Turn on affiliate promotion for a product, optionally setting the commission percent (0-100).',
      inputSchema: z.object({ product_id: z.string(), commission_percent: z.number().int().min(0).max(100).optional() }),
    },
    async ({ product_id, commission_percent }, ctx) =>
      tool(() => enableAffiliates(identityOf(ctx), product_id, commission_percent)),
  )

  server.registerTool(
    'disable_affiliates',
    {
      title: 'Disable Affiliates',
      description: 'Turn off affiliate promotion for a product.',
      inputSchema: z.object({ product_id: z.string() }),
    },
    async ({ product_id }, ctx) => tool(() => disableAffiliates(identityOf(ctx), product_id)),
  )

  server.registerTool(
    'set_affiliate_commission',
    {
      title: 'Set Affiliate Commission',
      description: 'Set the affiliate commission percent (0-100) for a product.',
      inputSchema: z.object({ product_id: z.string(), percent: z.number().int().min(0).max(100) }),
    },
    async ({ product_id, percent }, ctx) =>
      tool(() => setAffiliateCommission(identityOf(ctx), product_id, percent)),
  )

  server.registerTool(
    'save_product_as_draft',
    {
      title: 'Save Product as Draft',
      description: 'Take a product off-sale and mark it as a draft (is_live: false).',
      inputSchema: z.object({ product_id: z.string() }),
    },
    async ({ product_id }, ctx) => tool(() => saveProductAsDraft(identityOf(ctx), product_id)),
  )

  server.registerTool(
    'publish_product',
    {
      title: 'Publish Product',
      description: 'Make a product live and purchasable (is_live: true).',
      inputSchema: z.object({ product_id: z.string() }),
    },
    async ({ product_id }, ctx) => tool(() => publishProduct(identityOf(ctx), product_id)),
  )

  server.registerTool(
    'unpublish_product',
    {
      title: 'Unpublish Product',
      description: 'Take a live product off-sale (is_live: false). Same effect as save_product_as_draft.',
      inputSchema: z.object({ product_id: z.string() }),
    },
    async ({ product_id }, ctx) => tool(() => unpublishProduct(identityOf(ctx), product_id)),
  )
})

const verifyToken = async (_req: Request, bearerToken?: string): Promise<AuthInfo | undefined> => {
  if (!bearerToken) return undefined

  const identity = await resolveAgentToken(`Bearer ${bearerToken}`)
  if (!identity) return undefined

  return {
    token: bearerToken,
    scopes: identity.scopes,
    clientId: identity.userId,
    extra: { identity },
  }
}

const authHandler = withMcpAuth(handler, verifyToken, {
  required: true,
  resourceMetadataPath: '/.well-known/oauth-protected-resource',
})

export { authHandler as GET, authHandler as POST }
