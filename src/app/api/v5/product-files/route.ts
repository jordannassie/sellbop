import { NextRequest, NextResponse } from 'next/server'
import { tryGetAdmin, getAuthUser, resolveAndVerifyProductOwnership } from '@/lib/supabase/v5-helpers'

// GET /api/v5/product-files?slug=<product-slug>
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ files: [] })

  const admin = tryGetAdmin()
  if (!admin) return NextResponse.json({ files: [], fallback: true })

  // Resolve product without ownership check so sellers and buyers can read
  const { data: product } = await admin
    .from('products')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (!product) return NextResponse.json({ files: [] })

  const { data: files, error } = await admin
    .from('product_files')
    .select('*')
    .eq('product_id', product.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[V5 product-files GET]', error.message)
    return NextResponse.json({ files: [], error: error.message })
  }

  return NextResponse.json({ files: files ?? [] })
}

// POST /api/v5/product-files — requires auth
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as {
    slug: string
    fileName: string
    fileUrl: string
    fileType?: string
    visibility?: string
  }

  if (!body.slug || !body.fileName || !body.fileUrl) {
    return NextResponse.json({ error: 'slug, fileName, and fileUrl are required.' }, { status: 400 })
  }

  const resolved = await resolveAndVerifyProductOwnership(body.slug, user.id)
  if (!resolved) {
    // Product not in Supabase yet — return a client-side-only record
    return NextResponse.json({
      file: {
        id: `local-${crypto.randomUUID()}`,
        productId: body.slug,
        sellerId: user.id,
        fileName: body.fileName,
        fileUrl: body.fileUrl,
        fileType: body.fileType ?? 'link',
        visibility: body.visibility ?? 'buyers',
        sortOrder: 0,
        createdAt: new Date().toISOString(),
      },
      persisted: false,
    })
  }

  const admin = tryGetAdmin()!

  const { data: file, error } = await admin
    .from('product_files')
    .insert({
      product_id: resolved.productId,
      seller_id: user.id,
      file_name: body.fileName,
      file_url: body.fileUrl,
      file_type: body.fileType ?? 'link',
      visibility: body.visibility ?? 'buyers',
    })
    .select()
    .single()

  if (error) {
    console.error('[V5 product-files POST]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ file, persisted: true })
}
