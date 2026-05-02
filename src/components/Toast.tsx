'use client'

import { useEffect } from 'react'

export interface ToastMessage {
  id: string
  message: string
  isBot: boolean
}

interface ToastProps {
  toasts: ToastMessage[]
  onRemove: (id: string) => void
}

export default function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 5000)
    return () => clearTimeout(timer)
  }, [toast.id, onRemove])

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-xl border text-sm animate-fade-in ${
        toast.isBot
          ? 'bg-red-950 border-red-700 text-red-200'
          : 'bg-green-950 border-green-700 text-green-200'
      }`}
    >
      <span className="text-lg leading-none">{toast.isBot ? '🤖' : '👁️'}</span>
      <p className="flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-gray-400 hover:text-white ml-1 leading-none"
      >
        ✕
      </button>
    </div>
  )
}
