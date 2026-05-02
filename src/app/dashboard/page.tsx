'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Pdf, TrackingEvent } from '@/types'
import Toast, { ToastMessage } from '@/components/Toast'

export default function Dashboard() {
  const [pdfs, setPdfs] = useState<Pdf[]>([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((event: TrackingEvent) => {
    const label = event.is_bot ? 'Bot detected' : 'PDF opened'
    const loc = [event.city, event.country].filter(Boolean).join(', ') || 'Unknown location'
    const message = `${label}: ${event.pdf_name} — ${loc} on ${event.device ?? 'Unknown device'}`
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, isBot: event.is_bot }])
  }, [])

  const fetchPdfs = useCallback(async () => {
    const { data: pdfRows } = await supabase.from('pdfs').select('*').order('created_at', { ascending: false })
    if (!pdfRows) return

    const { data: eventRows } = await supabase
      .from('tracking_events')
      .select('tracking_id, is_bot')

    const counts: Record<string, { human: number; bot: number }> = {}
    for (const e of eventRows ?? []) {
      if (!counts[e.tracking_id]) counts[e.tracking_id] = { human: 0, bot: 0 }
      if (e.is_bot) counts[e.tracking_id].bot++
      else counts[e.tracking_id].human++
    }

    setPdfs(
      pdfRows.map((p) => ({
        ...p,
        human_count: counts[p.tracking_id]?.human ?? 0,
        bot_count: counts[p.tracking_id]?.bot ?? 0,
        open_count: (counts[p.tracking_id]?.human ?? 0) + (counts[p.tracking_id]?.bot ?? 0),
      }))
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPdfs()
  }, [fetchPdfs])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('tracking_events_inserts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tracking_events' },
        (payload) => {
          const event = payload.new as TrackingEvent
          addToast(event)
          // Refresh counts
          fetchPdfs()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [addToast, fetchPdfs])

  const copyLink = (trackingId: string) => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/track/${trackingId}`
    navigator.clipboard.writeText(url)
    setCopiedId(trackingId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="min-h-screen bg-gray-950">
        {/* Header */}
        <header className="border-b border-gray-800 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">
                P
              </div>
              <h1 className="text-xl font-semibold text-white">PDF Tracker</h1>
            </div>
            <Link
              href="/upload"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Upload PDF
            </Link>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Your PDFs</h2>
            <p className="text-gray-400 text-sm mt-1">
              Real-time tracking for every document you share
            </p>
          </div>

          {loading ? (
            <div className="text-gray-400 text-sm">Loading...</div>
          ) : pdfs.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-4xl mb-4">📄</p>
              <p className="text-lg font-medium text-gray-400">No PDFs uploaded yet</p>
              <p className="text-sm mt-2">Upload your first PDF to start tracking opens</p>
              <Link
                href="/upload"
                className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Upload PDF
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">PDF Name</th>
                    <th className="px-4 py-3 text-left">Campaign</th>
                    <th className="px-4 py-3 text-left">Tracking Link</th>
                    <th className="px-4 py-3 text-center">Opens</th>
                    <th className="px-4 py-3 text-left">Uploaded</th>
                    <th className="px-4 py-3 text-left">Events</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {pdfs.map((pdf) => (
                    <tr key={pdf.id} className="bg-gray-950 hover:bg-gray-900/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-white max-w-[200px] truncate">
                        {pdf.name}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {pdf.campaign_name ?? <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 truncate max-w-[180px] text-xs font-mono">
                            {appUrl}/track/{pdf.tracking_id}
                          </span>
                          <button
                            onClick={() => copyLink(pdf.tracking_id)}
                            className="shrink-0 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded transition-colors"
                          >
                            {copiedId === pdf.tracking_id ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-white font-semibold">{pdf.open_count ?? 0}</span>
                          <div className="flex gap-2 text-xs">
                            <span className="text-green-400">{pdf.human_count ?? 0} human</span>
                            <span className="text-red-400">{pdf.bot_count ?? 0} bot</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(pdf.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/events/${pdf.tracking_id}`}
                          className="text-blue-400 hover:text-blue-300 text-xs underline underline-offset-2"
                        >
                          View events
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </>
  )
}
