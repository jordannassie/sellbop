import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { generateRequestSchema } from '@/lib/product-ideas/types'
import { generateProductIdeas } from '@/lib/product-ideas/generate'

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = generateRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid search request.' }, { status: 400 })
  }

  try {
    const result = await generateProductIdeas(parsed.data)
    return NextResponse.json(result)
  } catch (err) {
    const code = err instanceof Error ? err.message : 'UNKNOWN'
    if (code === 'OPENAI_UNAVAILABLE') {
      return NextResponse.json({ error: 'AI is not configured. Please try again later.' }, { status: 503 })
    }
    if (code === 'OPENAI_FAILED' || code === 'AI_MALFORMED') {
      return NextResponse.json({ error: 'Could not generate product ideas. Please try again.' }, { status: 502 })
    }
    console.error('[Product Ideas] generate failed:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
