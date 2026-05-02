import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { TrackPayload, EventJson } from '@/types'

interface IpApiResponse {
  city?: string
  country?: string
  hosting?: boolean
  status?: string
}

function getIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? '127.0.0.1'
}

function isBotUserAgent(ua: string): boolean {
  const lower = ua.toLowerCase()
  const botTokens = ['axios', 'curl', 'python', 'java', 'bot', 'crawler', 'spider', 'wget', 'scrapy']
  return botTokens.some((t) => lower.includes(t))
}

export async function POST(req: NextRequest) {
  try {
    const body: TrackPayload & { browser?: string; os?: string } = await req.json()
    const {
      trackingId,
      userAgent,
      screenWidth,
      screenHeight,
      timezone,
      language,
      cookieEnabled,
      canvasPassed,
      platform,
      browser: clientBrowser,
      os: clientOs,
    } = body

    if (!trackingId) {
      return NextResponse.json({ error: 'Missing trackingId' }, { status: 400 })
    }

    const db = supabaseAdmin()

    // Look up PDF
    const { data: pdf, error: pdfError } = await db
      .from('pdfs')
      .select('*')
      .eq('tracking_id', trackingId)
      .single()

    if (pdfError || !pdf) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 })
    }

    // Get signed URL for redirect (always return it regardless of bot status)
    const { data: signedData } = await db.storage
      .from('pdfs')
      .createSignedUrl(pdf.storage_path, 3600)

    const pdfUrl = signedData?.signedUrl ?? null

    const ip = getIp(req)
    let isBot = false
    let city: string | null = null
    let country: string | null = null

    // Step 1 — IP check
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=city,country,hosting`, {
        signal: AbortSignal.timeout(3000),
      })
      const geo: IpApiResponse = await geoRes.json()
      if (geo.hosting === true) isBot = true
      city = geo.city ?? null
      country = geo.country ?? null
    } catch {
      // geo lookup failed — don't block the request
    }

    // Step 2 — UA check
    if (!isBot && isBotUserAgent(userAgent)) isBot = true

    // Step 3 — Canvas check
    if (!isBot && !canvasPassed) isBot = true

    const device = platform ?? (/Mobi|Android/i.test(userAgent) ? 'mobile' : 'desktop')
    const browser = clientBrowser ?? null
    const os = clientOs ?? null

    const eventId = crypto.randomUUID()
    const openedAt = new Date().toISOString()

    // Build JSON event file
    const eventJson: EventJson = {
      event_id: eventId,
      tracking_id: trackingId,
      pdf_name: pdf.name,
      campaign_name: pdf.campaign_name,
      opened_at: openedAt,
      ip,
      location: { city, country },
      device: {
        user_agent: userAgent,
        browser,
        os,
        platform: device,
        screen_width: screenWidth,
        screen_height: screenHeight,
      },
      browser_signals: {
        timezone,
        language,
        cookie_enabled: cookieEnabled,
        canvas_passed: canvasPassed,
      },
      is_bot: isBot,
    }

    const timestamp = openedAt.replace(/[:.]/g, '-')
    // Path relative to the bucket root — do NOT prefix with bucket name
    const eventFilePath = `${trackingId}/${timestamp}_${eventId}.json`

    // Save JSON to storage
    const jsonBytes = new TextEncoder().encode(JSON.stringify(eventJson, null, 2))
    const { error: storageError } = await db.storage
      .from('events')
      .upload(eventFilePath, jsonBytes, { contentType: 'application/json', upsert: false })

    // Insert tracking event row
    const { data: inserted, error: insertError } = await db
      .from('tracking_events')
      .insert({
        id: eventId,
        tracking_id: trackingId,
        pdf_name: pdf.name,
        campaign_name: pdf.campaign_name,
        opened_at: openedAt,
        ip,
        city,
        country,
        device,
        browser,
        os,
        screen_width: screenWidth,
        screen_height: screenHeight,
        timezone,
        language,
        is_bot: isBot,
        event_file_path: storageError ? null : eventFilePath,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
    }

    return NextResponse.json({ success: true, pdf_url: pdfUrl, is_bot: isBot })
  } catch (err: unknown) {
    console.error('Track error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
