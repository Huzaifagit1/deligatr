'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

export default function UploadPage() {
  const [campaignName, setCampaignName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setError(null)
    setTrackingUrl(null)

    const formData = new FormData()
    formData.append('pdf', file)
    formData.append('campaign_name', campaignName)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload failed')
      setTrackingUrl(json.tracking_url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const copyUrl = () => {
    if (!trackingUrl) return
    navigator.clipboard.writeText(trackingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => {
    setTrackingUrl(null)
    setFile(null)
    setCampaignName('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Dashboard
          </Link>
          <div className="w-px h-4 bg-gray-700" />
          <h1 className="text-lg font-semibold text-white">Upload PDF</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-12">
        {trackingUrl ? (
          <div className="bg-gray-900 border border-green-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">✅</span>
              <h2 className="text-lg font-semibold text-white">PDF uploaded successfully!</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Share this tracking link. Every real open will be logged in your dashboard.
            </p>
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-3">
              <span className="text-xs font-mono text-green-300 break-all flex-1">{trackingUrl}</span>
              <button
                onClick={copyUrl}
                className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={reset}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Upload another
              </button>
              <Link
                href="/dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Go to dashboard
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
            <h2 className="text-lg font-semibold text-white">New tracked PDF</h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                PDF File <span className="text-red-400">*</span>
              </label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,application/pdf"
                required
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:text-sm file:font-medium hover:file:bg-blue-700 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Campaign Name
              </label>
              <input
                type="text"
                placeholder="e.g. Deli - Accounting"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? 'Uploading...' : 'Upload & Generate Link'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
