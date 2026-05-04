import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('pdf') as File | null
    const campaignName = (formData.get('campaign_name') as string) || null

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'A PDF file is required' }, { status: 400 })
    }

    const db = supabaseAdmin()
    const trackingId = crypto.randomUUID()
    const pdfId = crypto.randomUUID()
    const storagePath = `pdfs/${pdfId}/${file.name}`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await db.storage
      .from('pdfs')
      .upload(storagePath, arrayBuffer, { contentType: 'application/pdf', upsert: false })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { error: insertError } = await db.from('pdfs').insert({
      id: pdfId,
      name: file.name,
      storage_path: storagePath,
      tracking_id: trackingId,
      campaign_name: campaignName,
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    return NextResponse.json({
      tracking_url: `${appUrl}/track/${trackingId}?email={{email}}`,
      tracking_id: trackingId,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
