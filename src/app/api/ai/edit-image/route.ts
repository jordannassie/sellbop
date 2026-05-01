import { NextRequest, NextResponse } from 'next/server'

// NOTE: OPENAI_API_KEY is accessed server-side only via process.env.
// It is never passed to the client or exposed in any client bundle.
//
// Strategy: use DALL-E 3 to generate a contextual "edit" since DALL-E 2 edit
// requires RGBA PNG with specific dimensions that are hard to guarantee from
// arbitrary uploaded images. Results are high quality and reliable.

type ImageType = 'product' | 'store_banner' | 'store_avatar'

const SIZE_BY_TYPE: Record<ImageType, string> = {
  product:      '1024x1024',
  store_banner: '1792x1024',
  store_avatar: '1024x1024',
}

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

async function persistToStorage(
  imageUrl: string,
  ownerId: string,
  imageType: ImageType,
): Promise<string | null> {
  try {
    const { getSupabaseAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = getSupabaseAdminClient()

    const res = await fetch(imageUrl)
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())

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

  const type = (imageType as ImageType) in SIZE_BY_TYPE ? (imageType as ImageType) : 'product'
  const size = SIZE_BY_TYPE[type]
  const fullPrompt = buildEditPrompt(prompt.trim(), type)

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
        Authorization:  `Bearer ${apiKey}`,
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
      console.error('[edit-image] OpenAI error:', errBody)
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

    const persistedUrl = await persistToStorage(openaiUrl, ownerId, type)

    return NextResponse.json({
      success:   true,
      imageUrl:  persistedUrl ?? openaiUrl,
      persisted: !!persistedUrl,
    })
  } catch (err) {
    console.error('[edit-image] Unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected error during image editing.' }, { status: 500 })
  }
}
