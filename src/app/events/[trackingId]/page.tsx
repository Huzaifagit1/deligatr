'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { TrackingEvent } from '@/types'

type Filter = 'all' | 'human' | 'bot'

export default function EventsPage() {
  const params = useParams()
  const trackingId = params.trackingId as string

  const [events, setEvents] = useState<TrackingEvent[]>([])
  const [pdfName, setPdfName] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    if (!trackingId) return

    const load = async () => {
      const { data: pdf } = await supabase
        .from('pdfs')
        .select('name')
        .eq('tracking_id', trackingId)
        .single()

      if (pdf) setPdfName(pdf.name)

      const { data } = await supabase
        .from('tracking_events')
        .select('*')
        .eq('tracking_id', trackingId)
        .order('opened_at', { ascending: false })

      setEvents(data ?? [])
      setLoading(false)
    }

    load()
  }, [trackingId])

  const downloadJson = async (event: TrackingEvent) => {
    if (!event.event_file_path) return
    // Strip leading "events/" if it was stored with the bucket name prefix (old records)
    const storagePath = event.event_file_path.replace(/^events\//, '')
    const { data } = await supabase.storage.from('events').download(storagePath)
    if (!data) return
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = `event_${event.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = events.filter((e) => {
    if (filter === 'human') return !e.is_bot
    if (filter === 'bot') return e.is_bot
    return true
  })

  const humanCount = events.filter((e) => !e.is_bot).length
  const botCount = events.filter((e) => e.is_bot).length

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Dashboard
          </Link>
          <div className="w-px h-4 bg-gray-700" />
          <div>
            <h1 className="text-lg font-semibold text-white">{pdfName || 'Events'}</h1>
            <p className="text-xs text-gray-500 font-mono">{trackingId}</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
            <p className="text-2xl font-bold text-white">{events.length}</p>
          </div>
          <div className="bg-gray-900 border border-green-900 rounded-lg px-4 py-3">
            <p className="text-xs text-green-600 uppercase tracking-wide">Humans</p>
            <p className="text-2xl font-bold text-green-400">{humanCount}</p>
          </div>
          <div className="bg-gray-900 border border-red-900 rounded-lg px-4 py-3">
            <p className="text-xs text-red-600 uppercase tracking-wide">Bots</p>
            <p className="text-2xl font-bold text-red-400">{botCount}</p>
          </div>
        </div>

        {/* Filter toggle */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1 w-fit mb-6">
          {(['all', 'human', 'bot'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {f === 'all' ? 'All' : f === 'human' ? 'Humans Only' : 'Bots Only'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-gray-400 text-sm">Loading events...</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-500 text-sm py-12 text-center">No events yet for this filter.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Opened At</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-left">Device</th>
                  <th className="px-4 py-3 text-left">Browser</th>
                  <th className="px-4 py-3 text-left">OS</th>
                  <th className="px-4 py-3 text-left">Screen</th>
                  <th className="px-4 py-3 text-left">Timezone</th>
                  <th className="px-4 py-3 text-left">JSON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((event) => (
                  <tr key={event.id} className="bg-gray-950 hover:bg-gray-900/50 transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          event.is_bot
                            ? 'bg-red-900/50 text-red-300 border border-red-800'
                            : 'bg-green-900/50 text-green-300 border border-green-800'
                        }`}
                      >
                        {event.is_bot ? 'Bot' : 'Human'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap text-xs">
                      {new Date(event.opened_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {[event.city, event.country].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 capitalize">{event.device ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{event.browser ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{event.os ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400">
                      {event.screen_width && event.screen_height
                        ? `${event.screen_width}×${event.screen_height}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{event.timezone ?? '—'}</td>
                    <td className="px-4 py-3">
                      {event.event_file_path ? (
                        <button
                          onClick={() => downloadJson(event)}
                          className="text-blue-400 hover:text-blue-300 text-xs underline underline-offset-2"
                        >
                          Download
                        </button>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
