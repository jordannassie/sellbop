import 'server-only'

import { requireScope, type AgentIdentity } from '@/lib/agent/auth'
import { resolveStoreForOperation, resolveProductInShop, AgentShopAccessError } from '@/lib/agent/shop-access'
import { withActivityLog } from '@/lib/agent/activity-log'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { buildStoragePath } from '@/lib/supabase/storage'
import { loadProductMedia, syncCoverImageFromMedia } from '@/lib/product-media/server'
import { MAX_COVER_IMAGE_SIZE_BYTES, MAX_PRODUCT_FILE_SIZE_BYTES } from '@/lib/platform-config'
import { auditShop } from '@/lib/agent/shop-service'
import { buildImagePrompt, purposeLabel } from './brand-context'
import { getOpenAiImageProvider } from './providers/openai-image'
import { renderProductPdf } from './pdf-renderer'
import { getCreativeCapabilities } from './capabilities'
import { enforceGenerationRateLimit, trackCreativeUsage } from './usage-tracking'
import { CreativeError, safeProviderMessage } from './errors'
import { sanitizeFilename, uniqueFilename } from './filename'
import type {
  AspectRatio,
  BrandContext,
  CreativeToolResult,
  ImagePurpose,
  PdfContentInput,
} from './types'

export { getCreativeCapabilities }

function decodeBase64(base64Data: string): Buffer {
  return Buffer.from(base64Data.replace(/^data:[^;]+;base64,/, ''), 'base64')
}

async function saveProductImage(params: {
  identity: AgentIdentity
  productId: string
  storeOwnerId: string
  storeId: string
  buffer: Buffer
  mimeType: string
  fileName: string
  imageType: ImagePurpose
  makePrimary: boolean
}) {
  const admin = getSupabaseAdminClient()
  if (params.buffer.byteLength > MAX_COVER_IMAGE_SIZE_BYTES) {
    throw new CreativeError('storage_failed', 'Generated image exceeds the 5 MB limit.', 400)
  }

  const path = buildStoragePath(params.storeOwnerId, params.fileName)
  const { error: uploadError } = await admin.storage
    .from('product-images')
    .upload(path, params.buffer, { contentType: params.mimeType, upsert: false })

  if (uploadError) {
    throw new CreativeError('storage_failed', 'Could not save generated image.', 500)
  }

  const { data: urlData } = admin.storage.from('product-images').getPublicUrl(path)
  const imageUrl = urlData.publicUrl

  const useGallery = params.imageType !== 'product_cover' && !params.makePrimary

  if (useGallery) {
    const media = await loadProductMedia(params.productId)
    const { data: row, error } = await admin.from('product_media').insert({
      product_id: params.productId,
      seller_id: params.storeOwnerId,
      media_type: 'image',
      url: imageUrl,
      thumbnail_url: imageUrl,
      provider: 'generated',
      storage_path: path,
      sort_order: media.length,
    }).select('*').single()

    if (error) throw new CreativeError('attachment_failed', 'Could not attach gallery image.', 500)
    if (params.makePrimary) await syncCoverImageFromMedia(params.productId)
    return { url: imageUrl, mediaId: row.id, primary: params.makePrimary }
  }

  const { data: product, error } = await admin
    .from('products')
    .update({ cover_image_url: imageUrl, updated_at: new Date().toISOString() })
    .eq('id', params.productId)
    .select('id, cover_image_url')
    .single()

  if (error) throw new CreativeError('attachment_failed', 'Could not set product cover image.', 500)
  return { url: imageUrl, mediaId: undefined, primary: true, product }
}

async function saveProductPdfFile(params: {
  identity: AgentIdentity
  productId: string
  storeOwnerId: string
  storeId: string
  buffer: Buffer
  fileName: string
}) {
  const admin = getSupabaseAdminClient()
  if (params.buffer.byteLength > MAX_PRODUCT_FILE_SIZE_BYTES) {
    throw new CreativeError('storage_failed', 'Generated PDF exceeds the 100 MB limit.', 400)
  }

  const path = buildStoragePath(params.storeOwnerId, params.fileName)
  const { error: uploadError } = await admin.storage
    .from('product-files')
    .upload(path, params.buffer, { contentType: 'application/pdf', upsert: false })

  if (uploadError) {
    throw new CreativeError('storage_failed', 'Could not save generated PDF.', 500)
  }

  const { data: file, error } = await admin.from('product_files').insert({
    product_id: params.productId,
    seller_id: params.storeOwnerId,
    file_name: params.fileName,
    file_url: '',
    file_type: 'application/pdf',
    file_size: params.buffer.byteLength,
    storage_path: path,
    upload_status: 'complete',
    visibility: 'buyers',
    sort_order: 0,
  }).select('*').single()

  if (error) throw new CreativeError('attachment_failed', 'Could not attach generated PDF.', 500)
  return file
}

export async function generateProductImageForAgent(
  identity: AgentIdentity,
  input: {
    shop_id?: string
    product_id: string
    prompt: string
    image_type?: ImagePurpose
    make_primary?: boolean
    aspect_ratio?: AspectRatio
    brand_context?: BrandContext
  },
): Promise<CreativeToolResult> {
  requireScope(identity, 'files:write')
  const imageType = input.image_type ?? 'product_cover'
  const makePrimary = input.make_primary ?? imageType === 'product_cover'

  try {
    await enforceGenerationRateLimit(identity, 'product_image')
    const provider = getOpenAiImageProvider()
    if (!provider.isConfigured()) {
      throw new CreativeError('provider_not_configured', 'Image generation is not configured. Set OPENAI_API_KEY.', 503)
    }

    const { product, store } = await resolveProductInShop(identity, input.product_id, input.shop_id)
    const fullPrompt = buildImagePrompt({
      userPrompt: input.prompt,
      purpose: purposeLabel(imageType),
      brandContext: input.brand_context,
      shop: store,
      product,
    })

    return await withActivityLog(identity, 'generate_product_image', 'product', product.id, async () => {
      const generated = await provider.generateImage({
        prompt: fullPrompt,
        purpose: imageType,
        aspectRatio: input.aspect_ratio ?? (imageType === 'product_cover' ? '1:1' : input.aspect_ratio),
        brandContext: input.brand_context,
      })

      const fileName = uniqueFilename(product.title ?? product.slug ?? 'product', '.png', imageType)
      const attached = await saveProductImage({
        identity,
        productId: product.id,
        storeOwnerId: store.owner_user_id,
        storeId: store.id,
        buffer: generated.buffer,
        mimeType: generated.mimeType,
        fileName,
        imageType,
        makePrimary,
      })

      await trackCreativeUsage({
        identity,
        storeId: store.id,
        productId: product.id,
        generationType: 'product_image',
        provider: generated.provider,
        model: generated.model,
        status: 'ok',
        metadata: { image_type: imageType, primary: attached.primary },
      })

      return {
        result: {
          success: true,
          shop_id: store.id,
          product_id: product.id,
          media_id: attached.mediaId,
          url: attached.url,
          primary: attached.primary,
          provider: generated.provider,
          model: generated.model,
          generation_status: 'completed' as const,
        },
        storeId: store.id,
        summary: `Generated ${imageType.replace(/_/g, ' ')} for ${product.title}`,
      }
    }, input.shop_id)
  } catch (err) {
    const code = err instanceof CreativeError ? err.code : 'generation_failed'
    await trackCreativeUsage({
      identity,
      storeId: input.shop_id ?? identity.storeId,
      productId: input.product_id,
      generationType: 'product_image',
      status: 'error',
      errorCode: code,
    })
    if (err instanceof CreativeError) return err.toResult()
    return {
      success: false,
      error_code: 'generation_failed',
      message: safeProviderMessage(err),
      generation_status: 'failed',
      product_id: input.product_id,
    }
  }
}

export async function generateShopBannerForAgent(
  identity: AgentIdentity,
  input: {
    shop_id?: string
    prompt: string
    brand_context?: BrandContext
    creator_context?: string
  },
): Promise<CreativeToolResult> {
  requireScope(identity, 'shops:write')

  try {
    await enforceGenerationRateLimit(identity, 'shop_banner')
    const provider = getOpenAiImageProvider()
    if (!provider.isConfigured()) {
      throw new CreativeError('provider_not_configured', 'Banner generation is not configured. Set OPENAI_API_KEY.', 503)
    }

    const store = await resolveStoreForOperation(identity, input.shop_id)
    const promptWithContext = [
      input.creator_context ? `Creator/audience: ${input.creator_context}` : null,
      buildImagePrompt({
        userPrompt: input.prompt,
        purpose: purposeLabel('shop_banner'),
        brandContext: input.brand_context,
        shop: store,
      }),
    ].filter(Boolean).join('\n')

    return await withActivityLog(identity, 'generate_shop_banner', 'store', store.id, async () => {
      const generated = await provider.generateImage({
        prompt: promptWithContext,
        purpose: 'shop_banner',
        aspectRatio: '16:9',
        brandContext: input.brand_context,
      })

      if (generated.buffer.byteLength > MAX_COVER_IMAGE_SIZE_BYTES) {
        throw new CreativeError('storage_failed', 'Generated banner exceeds the 5 MB limit.', 400)
      }

      const admin = getSupabaseAdminClient()
      const fileName = uniqueFilename(store.slug ?? store.name ?? 'shop', '.png', 'banner')
      const path = buildStoragePath(store.owner_user_id, fileName)
      const { error: uploadError } = await admin.storage
        .from('product-images')
        .upload(path, generated.buffer, { contentType: generated.mimeType, upsert: false })

      if (uploadError) throw new CreativeError('storage_failed', 'Could not save generated banner.', 500)

      const { data: urlData } = admin.storage.from('product-images').getPublicUrl(path)
      const bannerUrl = urlData.publicUrl

      const { error } = await admin
        .from('stores')
        .update({ banner_url: bannerUrl, updated_at: new Date().toISOString() })
        .eq('id', store.id)

      if (error) throw new CreativeError('attachment_failed', 'Could not update shop banner.', 500)

      await trackCreativeUsage({
        identity,
        storeId: store.id,
        generationType: 'shop_banner',
        provider: generated.provider,
        model: generated.model,
        status: 'ok',
      })

      return {
        result: {
          success: true,
          shop_id: store.id,
          url: bannerUrl,
          provider: generated.provider,
          model: generated.model,
          generation_status: 'completed' as const,
        },
        storeId: store.id,
        summary: `Generated shop banner for ${store.name}`,
      }
    }, input.shop_id)
  } catch (err) {
    const code = err instanceof CreativeError ? err.code : 'generation_failed'
    await trackCreativeUsage({
      identity,
      storeId: input.shop_id ?? identity.storeId,
      generationType: 'shop_banner',
      status: 'error',
      errorCode: code,
    })
    if (err instanceof CreativeError) return err.toResult()
    return {
      success: false,
      error_code: 'generation_failed',
      message: safeProviderMessage(err),
      generation_status: 'failed',
    }
  }
}

export async function generateProductPdfForAgent(
  identity: AgentIdentity,
  input: {
    shop_id?: string
    product_id: string
    title?: string
    subtitle?: string
    audience?: string
    content_brief?: string
    sections?: PdfContentInput['sections']
    brand_context?: BrandContext
    author_name?: string
    include_health_disclaimer?: boolean
    prompt?: string
  },
): Promise<CreativeToolResult> {
  requireScope(identity, 'files:write')

  try {
    await enforceGenerationRateLimit(identity, 'product_pdf')
    const { product, store } = await resolveProductInShop(identity, input.product_id, input.shop_id)

    const pdfInput: PdfContentInput = {
      title: input.title ?? product.title,
      subtitle: input.subtitle,
      audience: input.audience ?? input.brand_context?.audience,
      content_brief: input.content_brief ?? input.prompt,
      sections: input.sections,
      author_name: input.author_name ?? input.brand_context?.brand_name ?? store.name,
      include_health_disclaimer: input.include_health_disclaimer,
    }

    return await withActivityLog(identity, 'generate_product_pdf', 'product', product.id, async () => {
      const buffer = await renderProductPdf({
        ...pdfInput,
        brandContext: input.brand_context,
        shopName: store.name,
      })

      const fileName = sanitizeFilename(product.title ?? product.slug ?? 'guide', '.pdf')
      const file = await saveProductPdfFile({
        identity,
        productId: product.id,
        storeOwnerId: store.owner_user_id,
        storeId: store.id,
        buffer,
        fileName,
      })

      await trackCreativeUsage({
        identity,
        storeId: store.id,
        productId: product.id,
        generationType: 'product_pdf',
        provider: 'sellbop_pdf',
        model: 'pdfkit',
        status: 'ok',
        metadata: { bytes: buffer.byteLength },
      })

      return {
        result: {
          success: true,
          shop_id: store.id,
          product_id: product.id,
          file_id: file.id,
          filename: file.file_name,
          url: undefined,
          provider: 'sellbop_pdf',
          generation_status: 'completed' as const,
        },
        storeId: store.id,
        summary: `Generated PDF for ${product.title}`,
      }
    }, input.shop_id)
  } catch (err) {
    const code = err instanceof CreativeError ? err.code : 'generation_failed'
    await trackCreativeUsage({
      identity,
      storeId: input.shop_id ?? identity.storeId,
      productId: input.product_id,
      generationType: 'product_pdf',
      status: 'error',
      errorCode: code,
    })
    if (err instanceof CreativeError) return err.toResult()
    if (err instanceof AgentShopAccessError) {
      return new CreativeError(err.message.includes('not found') ? 'invalid_product' : 'unauthorized_shop', err.message, err.status).toResult()
    }
    console.error('[creative] PDF generation failed:', err instanceof Error ? err.message : err)
    return {
      success: false,
      error_code: 'generation_failed',
      message: safeProviderMessage(err),
      generation_status: 'failed',
      product_id: input.product_id,
    }
  }
}

export async function buildProductAssetsForAgent(
  identity: AgentIdentity,
  input: {
    shop_id?: string
    product_id: string
    cover_prompt: string
    pdf_content?: Omit<PdfContentInput, 'title'> & { title?: string; content_brief?: string }
    supporting_image_prompts?: string[]
    brand_context?: BrandContext
    make_cover_primary?: boolean
  },
): Promise<CreativeToolResult & { steps?: CreativeToolResult[]; audit?: unknown }> {
  requireScope(identity, 'files:write')
  const steps: CreativeToolResult[] = []

  const cover = await generateProductImageForAgent(identity, {
    shop_id: input.shop_id,
    product_id: input.product_id,
    prompt: input.cover_prompt,
    image_type: 'product_cover',
    make_primary: input.make_cover_primary ?? true,
    brand_context: input.brand_context,
  })
  steps.push(cover)
  if (!cover.success) {
    return { success: false, error_code: cover.error_code, message: cover.message, steps, generation_status: 'failed' }
  }

  for (const prompt of input.supporting_image_prompts ?? []) {
    const img = await generateProductImageForAgent(identity, {
      shop_id: input.shop_id,
      product_id: input.product_id,
      prompt,
      image_type: 'supporting_image',
      make_primary: false,
      brand_context: input.brand_context,
    })
    steps.push(img)
  }

  if (input.pdf_content) {
    const pdf = await generateProductPdfForAgent(identity, {
      shop_id: input.shop_id,
      product_id: input.product_id,
      brand_context: input.brand_context,
      ...input.pdf_content,
    })
    steps.push(pdf)
    if (!pdf.success) {
      return { success: false, error_code: pdf.error_code, message: pdf.message, steps, generation_status: 'failed' }
    }
  }

  const audit = await auditShop(identity, input.shop_id)
  return {
    success: true,
    product_id: input.product_id,
    shop_id: input.shop_id,
    generation_status: 'completed',
    steps,
    audit,
  }
}
