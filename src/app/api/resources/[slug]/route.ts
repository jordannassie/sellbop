import { NextResponse } from 'next/server'
import { fetchResourcePage } from '@/lib/resources/fetch'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const page = await fetchResourcePage(slug)

  if (!page) {
    return NextResponse.json({ error: 'Resource not found.' }, { status: 404 })
  }

  return NextResponse.json({ page })
}
