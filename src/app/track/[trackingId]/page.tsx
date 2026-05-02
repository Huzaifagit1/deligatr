'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'

function canvasFingerprintTest(): boolean {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 50
    const ctx = canvas.getContext('2d')
    if (!ctx) return false
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillStyle = '#f60'
    ctx.fillRect(125, 1, 62, 20)
    ctx.fillStyle = '#069'
    ctx.fillText('PDF Tracker', 2, 15)
    ctx.fillStyle = 'rgba(102,204,0,0.7)'
    ctx.fillText('PDF Tracker', 4, 17)
    const dataUrl = canvas.toDataURL()
    return dataUrl.length > 500
  } catch {
    return false
  }
}

function getBrowserInfo(ua: string): { browser: string; os: string } {
  let browser = 'Unknown'
  let os = 'Unknown'

  if (/Edg\//.test(ua)) browser = 'Edge'
  else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = 'Chrome'
  else if (/Firefox\//.test(ua)) browser = 'Firefox'
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari'
  else if (/OPR\/|Opera\//.test(ua)) browser = 'Opera'

  if (/Windows NT/.test(ua)) os = 'Windows'
  else if (/Mac OS X/.test(ua)) os = 'macOS'
  else if (/Android/.test(ua)) os = 'Android'
  else if (/iPhone|iPad/.test(ua)) os = 'iOS'
  else if (/Linux/.test(ua)) os = 'Linux'

  return { browser, os }
}

export default function TrackPage() {
  const params = useParams()
  const trackingId = params.trackingId as string

  useEffect(() => {
    if (!trackingId) return

    const run = async () => {
      const canvasPassed = canvasFingerprintTest()
      const screenOk = screen.width > 0
      const cookieEnabled = navigator.cookieEnabled

      const ua = navigator.userAgent
      const { browser, os } = getBrowserInfo(ua)

      const payload = {
        trackingId,
        userAgent: ua,
        screenWidth: screen.width,
        screenHeight: screen.height,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        cookieEnabled,
        canvasPassed: canvasPassed && screenOk,
        platform: /Mobi|Android/i.test(ua) ? 'mobile' : 'desktop',
        browser,
        os,
      }

      let pdfUrl: string | null = null

      try {
        const res = await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        pdfUrl = data.pdf_url ?? null
      } catch {
        // silently continue — still redirect if we have a URL
      }

      if (pdfUrl) {
        window.location.href = pdfUrl
      }
    }

    run()
  }, [trackingId])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Loading your document...</p>
    </div>
  )
}
