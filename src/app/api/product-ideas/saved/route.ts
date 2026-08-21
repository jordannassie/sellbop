import { NextResponse } from 'next/server'
import { isSupabaseAdminConfigured } from '@/lib/env'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { readActiveStoreIdFromCookie } from '@/lib/stores/active-store'
import { saveProductIdeaSchema } from '@/lib/product-ideas/types'
import { productIdeaToInsert, rowToProductIdea } from '@/lib/product-ideas/db'

export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('product_ideas')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    if (error.message.includes('product_ideas')) {
      return NextResponse.json({ error: 'Saved ideas are not available yet. Apply migration 036.' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Could not load saved ideas.' }, { status: 500 })
  }

  return NextResponse.json({
    ideas: (data ?? []).map(row => rowToProductIdea(row as Record<string, unknown>)),
  })
}

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const userClient = await getSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = saveProductIdeaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid idea payload.' }, { status: 400 })
  }

  const storeId = parsed.data.storeId ?? (await readActiveStoreIdFromCookie())
  const admin = getSupabaseAdminClient()

  const ideaPayload = {
    ...parsed.data.idea,
    id: parsed.data.idea.id ?? crypto.randomUUID(),
    hook: parsed.data.idea.hook ?? '',
    description: parsed.data.idea.description ?? '',
    targetAudience: parsed.data.idea.targetAudience ?? '',
    category: parsed.data.idea.category ?? '',
    productType: (parsed.data.idea.productType as 'Guide') ?? 'Other',
    suggestedPriceMinCents: parsed.data.idea.suggestedPriceMinCents ?? 0,
    suggestedPriceMaxCents: parsed.data.idea.suggestedPriceMaxCents ?? 0,
    supportingKeywords: parsed.data.idea.supportingKeywords ?? [],
    trend: parsed.data.idea.trend ?? 'unknown',
    source: parsed.data.idea.source ?? 'ai_estimate',
    whyItCouldSell: parsed.data.idea.whyItCouldSell ?? '',
    productContents: parsed.data.idea.productContents ?? [],
  }

  const { data: existing } = await admin
    .from('product_ideas')
    .select('id')
    .eq('user_id', user.id)
    .eq('title', ideaPayload.title)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'You already saved this idea.' }, { status: 409 })
  }

  const insertRow = productIdeaToInsert(user.id, storeId, {
    id: ideaPayload.id,
    title: ideaPayload.title,
    hook: ideaPayload.hook,
    description: ideaPayload.description,
    targetAudience: ideaPayload.targetAudience,
    category: ideaPayload.category,
    productType: ideaPayload.productType as import('@/lib/product-ideas/types').ProductIdea['productType'],
    suggestedPriceMinCents: ideaPayload.suggestedPriceMinCents,
    suggestedPriceMaxCents: ideaPayload.suggestedPriceMaxCents,
    primaryKeyword: parsed.data.idea.primaryKeyword ?? null,
    supportingKeywords: ideaPayload.supportingKeywords,
    estimatedMonthlySearches: null,
    cpc: null,
    searchCompetition: null,
    trend: 'unknown',
    trendPercent: null,
    opportunityScore: parsed.data.idea.opportunityScore ?? null,
    source: (parsed.data.idea.source === 'youtube_data' ? 'youtube_data' : 'ai_estimate') as import('@/lib/product-ideas/types').ProductIdea['source'],
    whyItCouldSell: ideaPayload.whyItCouldSell,
    productContents: ideaPayload.productContents,
    research: parsed.data.idea.research as import('@/lib/product-ideas/types').ProductIdeaResearch | undefined,
  })

  const { data, error } = await admin
    .from('product_ideas')
    .insert(insertRow)
    .select('*')
    .single()

  if (error) {
    console.error('[Product Ideas] save failed:', error.message)
    if (error.message.includes('product_ideas')) {
      return NextResponse.json({ error: 'Saved ideas are not available yet. Apply migration 036.' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Could not save idea.' }, { status: 500 })
  }

  return NextResponse.json({ idea: rowToProductIdea(data as Record<string, unknown>) })
}
