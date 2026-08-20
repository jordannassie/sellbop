import { NextRequest, NextResponse } from 'next/server'
import { checkStoreSlugAvailability } from '@/lib/stores/slug-service'

export async function GET(req: NextRequest) {
  const value = req.nextUrl.searchParams.get('value') ?? ''
  const currentOwnerId = req.nextUrl.searchParams.get('ownerId') ?? ''
  const storeId = req.nextUrl.searchParams.get('storeId') ?? ''

  const result = await checkStoreSlugAvailability(value, {
    storeId: storeId || undefined,
    ownerId: currentOwnerId || undefined,
  })

  if (!result.available) {
    const isValidation = result.reason && !result.reason.toLowerCase().includes('taken')
    return NextResponse.json({
      status: isValidation ? 'invalid' : 'taken',
      message: result.reason ?? 'This store link is already taken.',
      slug: result.slug,
      available: false,
    })
  }

  return NextResponse.json({
    status: 'available',
    slug: result.slug,
    available: true,
  })
}
