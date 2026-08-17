import { NextResponse } from 'next/server'
import { getAllowedAdminEmails, isSupabaseAdminConfigured } from '@/lib/env'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { DEFAULT_HOME_CARDS, DEFAULT_RESOURCE_PAGES } from '@/lib/resources/defaults'

async function assertAdminApi() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email || !getAllowedAdminEmails().includes(user.email.toLowerCase())) {
    return false
  }
  return true
}

/** Idempotent seed — upserts all default resource pages and home cards */
export async function POST() {
  if (!(await assertAdminApi())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const admin = getSupabaseAdminClient()
  const now = new Date().toISOString()

  for (const page of DEFAULT_RESOURCE_PAGES) {
    await admin.from('resource_pages').upsert(
      {
        slug: page.slug,
        title: page.title,
        subtitle: page.subtitle,
        category: page.category,
        icon: page.icon,
        image_url: page.image_url,
        content_json: page.content_json,
        sort_order: page.sort_order,
        is_published: page.is_published,
        updated_at: now,
      },
      { onConflict: 'slug' },
    )
  }

  // Cards: delete home cards and re-insert for idempotency
  await admin.from('resource_cards').delete().eq('page_slug', 'home')

  await admin.from('resource_cards').insert(
    DEFAULT_HOME_CARDS.map(c => ({
      ...c,
      metadata: c.metadata as Record<string, never>,
      updated_at: now,
      created_at: now,
    })) as never,
  )

  return NextResponse.json({ ok: true, message: 'Resources seeded.' })
}
