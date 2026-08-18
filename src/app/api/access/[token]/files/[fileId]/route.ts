import 'server-only'

import { NextResponse } from 'next/server'
import { resolveFileDownload } from '@/lib/services/purchase-access'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string; fileId: string }> },
) {
  const { token, fileId } = await params
  const download = await resolveFileDownload(token, fileId)

  if (!download) {
    return NextResponse.json({ error: 'Access unavailable.' }, {
      status: 403,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  return NextResponse.redirect(download.url, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
