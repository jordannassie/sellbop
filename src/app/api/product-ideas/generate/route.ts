import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { generateRequestSchema } from '@/lib/product-ideas/types'
import { generateProductIdeas } from '@/lib/product-ideas/generate'
import { createProductIdeasLogger } from '@/lib/product-ideas/logger'

export const maxDuration = 30

function jsonError(
  requestId: string,
  code: string,
  message: string,
  status: number,
) {
  return NextResponse.json(
    {
      ok: false,
      error: { code, message },
      requestId,
    },
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

export async function POST(request: Request) {
  const log = createProductIdeasLogger()

  try {
    let supabase
    try {
      supabase = await getSupabaseServerClient()
    } catch (err) {
      log.error('auth client failed', err)
      return jsonError(log.requestId, 'AUTH_UNAVAILABLE', 'Could not verify your session. Please refresh and try again.', 503)
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return jsonError(log.requestId, 'UNAUTHORIZED', 'Unauthorized.', 401)
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonError(log.requestId, 'INVALID_BODY', 'Invalid request body.', 400)
    }

    const parsed = generateRequestSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError(log.requestId, 'INVALID_REQUEST', 'Invalid search request.', 400)
    }

    const result = await generateProductIdeas(parsed.data, log)

    return NextResponse.json(result, {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const code = err instanceof Error ? err.message : 'UNKNOWN'

    if (code === 'OPENAI_UNAVAILABLE') {
      return jsonError(
        log.requestId,
        'AI_GENERATION_UNAVAILABLE',
        'Product generation is temporarily unavailable. Please try again.',
        503,
      )
    }

    if (code === 'OPENAI_FAILED' || code === 'AI_MALFORMED') {
      log.error('generation failed', err)
      return jsonError(
        log.requestId,
        'PRODUCT_IDEAS_GENERATION_FAILED',
        "We couldn't generate product ideas right now.",
        502,
      )
    }

    log.error('unexpected failure', err)
    return jsonError(
      log.requestId,
      'PRODUCT_IDEAS_GENERATION_FAILED',
      "We couldn't generate product ideas right now.",
      500,
    )
  }
}
