import { NextRequest, NextResponse } from 'next/server'
import { tryGetAdmin, getAuthUser } from '@/lib/supabase/v5-helpers'

// DELETE /api/v5/product-files/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (id.startsWith('local-')) {
    // Local-only record — nothing to delete in Supabase
    return NextResponse.json({ deleted: true, persisted: false })
  }

  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = tryGetAdmin()
  if (!admin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  const { error } = await admin
    .from('product_files')
    .delete()
    .eq('id', id)
    .eq('seller_id', user.id)

  if (error) {
    console.error('[V5 product-files DELETE]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: true, persisted: true })
}
