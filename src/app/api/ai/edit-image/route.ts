import { NextRequest, NextResponse } from 'next/server'

// NOTE: OPENAI_API_KEY is accessed server-side only via process.env.
// It is never passed to the client or exposed in any client bundle.

type ImageType = 'product' | 'store_banner' | 'store_avatar'

// Configurable via Netlify env var; defaults to gpt-image-1.
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1'
const IS_DALLE3 = OPENAI_IMAGE_MODEL === 'dall-e-3'

// gpt-image-1/gpt-image-2: supported sizes are 1024x1024, 1536x1024, 1024x1536.
// dall-e-3: supports 1024x1024, 1792x1024, 1024x1792.
const SIZE_BY_TYPE: Record<ImageType, string> = {
  product:      '1024x1024',
  store_banner: IS_DALLE3 ? '1792x1024' : '1536x1024',
  store_avatar: '1024x1024',
}

const DEFAULT_QUALITY = IS_DALLE3 ? 'standard' : 'medium'

function buildEditPrompt(userInstructions: string, imageType: ImageType): string {
  const typeContext =
    imageType === 'product'
      ? 'product cover image for a digital creator commerce platform'
      : imageType === 'store_banner'
      ? 'wide store banner image for a creator online store'
      : 'square brand avatar for a creator online store'

  return (
    `Create a new ${typeContext}. ` +
    `Apply these changes: ${userInstructions}. ` +
    `High quality, professional, suitable for e-commerce. No text overlays or watermarks.`
  )
}

type ImageSource = { url: string } | { b64: string }

async function persistToStorage(
  source: ImageSource,
  ownerId: string,
  imageType: ImageType,
): Promise<string | null> {
  try {
    const { getSupabaseAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = getSupabaseAdminClient()

    let buffer: Buffer
    if ('url' in source) {
      const res = await fetch(source.url)
      if (!res.ok) return null
      buffer = Buffer.from(await res.arrayBuffer())
    } else {
      buffer = Buffer.from(source.b64, 'base64')
    }

    const path = `${ownerId}/${imageType}/${Date.now()}-ai-edited.png`
    const { data, error } = await adminClient.storage
      .from('ai-generated-images')
      .upload(path, buffer, { contentType: 'image/png', upsert: true, cacheControl: '31536000' })

    if (error || !data) return null

    const { data: urlData } = adminClient.storage
      .from('ai-generated-images')
      .getPublicUrl(data.path)

    return urlData.publicUrl
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  let body: {
    prompt?: string
    imageType?: string
    currentImageUrl?: string
    ownerId?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { prompt, imageType = 'product', ownerId = 'anon' } = body

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
    return NextResponse.json(
      { error: 'Edit instructions of at least 5 characters are required.' },
      { status: 400 },
    )
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'AI image generation is not configured yet.' },
      { status: 503 },
    )
  }

  const type      = (imageType as ImageType) in SIZE_BY_TYPE ? (imageType as ImageType) : 'product'
  const size      = SIZE_BY_TYPE[type]
  const fullPrompt = buildEditPrompt(prompt.trim(), type)

  const requestBody: Record<string, unknown> = {
    model:   OPENAI_IMAGE_MODEL,
    prompt:  fullPrompt,
    n:       1,
    size,
    quality: DEFAULT_QUALITY,
  }
  if (IS_DALLE3) requestBody.response_format = 'url'

  try {
    const genRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!genRes.ok) {
      const errBody = await genRes.text()
      console.error('[edit-image] OpenAI error:', errBody)
      return NextResponse.json(
        { error: 'Image generation failed. Please try again.' },
        { status: 502 },
      )
    }

    type OpenAIImageItem = { url?: string; b64_json?: string }
    const genData = (await genRes.json()) as { data: OpenAIImageItem[] }
    const item    = genData.data?.[0]

    if (!item) {
      return NextResponse.json({ error: 'No image returned from AI.' }, { status: 502 })
    }

    let source: ImageSource | null = null
    if (item.url)           source = { url: item.url }
    else if (item.b64_json) source = { b64: item.b64_json }

    if (!source) {
      return NextResponse.json({ error: 'No image data returned from AI.' }, { status: 502 })
    }

    const persistedUrl = await persistToStorage(source, ownerId, type)

    let imageUrl: string
    if (persistedUrl) {
      imageUrl = persistedUrl
    } else if (item.url) {
      imageUrl = item.url
    } else {
      imageUrl = `data:image/png;base64,${item.b64_json}`
    }

    return NextResponse.json({
      success:   true,
      imageUrl,
      persisted: !!persistedUrl,
    })
  } catch (err) {
    console.error('[edit-image] Unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected error during image editing.' }, { status: 500 })
  }
}
