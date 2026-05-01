import { NextRequest, NextResponse } from 'next/server'

// NOTE: OPENAI_API_KEY is accessed server-side only via process.env.
// It is never passed to the client or exposed in any client bundle.

type ImageType = 'product' | 'store_banner' | 'store_avatar'

const SIZE_BY_TYPE: Record<ImageType, string> = {
  product:      '1024x1024',
  store_banner: '1792x1024',
  store_avatar: '1024x1024',
}

const CONTEXT_BY_TYPE: Record<ImageType, string> = {
  product:
    'Product cover image for a digital creator. Professional, clean, high-converting. Suitable for e-commerce product page.',
  store_banner:
    'Wide store banner for a creator commerce store. Modern, professional, clean background. Aspect ratio 16:9.',
  store_avatar:
    'Square brand avatar or logo for a creator store. Simple, clean, memorable. Solid or minimal background.',
}

function buildPrompt(userPrompt: string, style: string, imageType: ImageType): string {
  const context = CONTEXT_BY_TYPE[imageType]
  const styleNote =
    style === 'Clean studio' ? 'Clean white studio background, professional product photography style.' :
    style === 'Lifestyle'    ? 'Warm lifestyle setting, natural light, authentic feel.' :
    style === 'Minimal'      ? 'Minimalist composition, lots of whitespace, subtle colors.' :
    style === 'Premium'      ? 'Premium luxury feel, dark tones, high-end photography style.' :
    style === 'Bold ad'      ? 'Bold graphic design style, high contrast, eye-catching colors.' :
    ''

  return `${userPrompt}. ${styleNote} ${context} Do not include text overlays or watermarks.`.trim()
}

async function persistToStorage(
  imageUrl: string,
  ownerId: string,
  imageType: ImageType,
): Promise<string | null> {
  try {
    // Dynamic import keeps 'server-only' guard in admin.ts
    const { getSupabaseAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = getSupabaseAdminClient()

    const res = await fetch(imageUrl)
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())

    const path = `${ownerId}/${imageType}/${Date.now()}-ai-generated.png`
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
  let body: { prompt?: string; style?: string; imageType?: string; ownerId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { prompt, style = 'Clean studio', imageType = 'product', ownerId = 'anon' } = body

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
    return NextResponse.json({ error: 'A prompt of at least 5 characters is required.' }, { status: 400 })
  }

  const type = (imageType as ImageType) in SIZE_BY_TYPE ? (imageType as ImageType) : 'product'
  const size  = SIZE_BY_TYPE[type]
  const fullPrompt = buildPrompt(prompt.trim(), style, type)

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'AI image generation is not configured yet.' },
      { status: 503 },
    )
  }

  try {
    const genRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:           'dall-e-3',
        prompt:          fullPrompt,
        n:               1,
        size,
        quality:         'standard',
        response_format: 'url',
      }),
    })

    if (!genRes.ok) {
      const errBody = await genRes.text()
      console.error('[generate-image] OpenAI error:', errBody)
      return NextResponse.json(
        { error: 'Image generation failed. Please try again.' },
        { status: 502 },
      )
    }

    const genData = (await genRes.json()) as { data: { url: string }[] }
    const openaiUrl = genData.data?.[0]?.url

    if (!openaiUrl) {
      return NextResponse.json({ error: 'No image returned from AI.' }, { status: 502 })
    }

    // Attempt to persist to Supabase Storage so the URL is permanent
    const persistedUrl = await persistToStorage(openaiUrl, ownerId, type)

    return NextResponse.json({
      success:  true,
      imageUrl: persistedUrl ?? openaiUrl,
      persisted: !!persistedUrl,
    })
  } catch (err) {
    console.error('[generate-image] Unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected error during image generation.' }, { status: 500 })
  }
}
