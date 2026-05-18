'use client'

import { useEffect, useState, createContext, useContext, useCallback } from 'react'

export type ToastSeverity = 'info' | 'concern' | 'urgent' | 'emergency' | 'success'

export interface ToastMessage {
  id: string
  title: string
  body?: string
  severity: ToastSeverity
  duration?: number
}

interface ToastContextValue {
  toasts: ToastMessage[]
  push: (msg: Omit<ToastMessage, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const severityClasses: Record<ToastSeverity, string> = {
  info:      'bg-blue-600 border-blue-700',
  concern:   'bg-yellow-500 border-yellow-600',
  urgent:    'bg-orange-500 border-orange-600',
  emergency: 'bg-red-600 border-red-700',
  success:   'bg-green-600 border-green-700',
}

const severityIcons: Record<ToastSeverity, string> = {
  info: 'ℹ', concern: '⚠', urgent: '🔶', emergency: '🚨', success: '✓',
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const duration = toast.duration ?? 5000
    const timer = setTimeout(() => onDismiss(toast.id), duration)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onDismiss])

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`flex items-start gap-3 w-full max-w-sm rounded-xl border text-white p-4 shadow-lg ${severityClasses[toast.severity]}`}
    >
      <span className="text-xl mt-0.5 flex-shrink-0" aria-hidden="true">{severityIcons[toast.severity]}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-lg leading-tight">{toast.title}</p>
        {toast.body && <p className="text-base opacity-90 mt-0.5">{toast.body}</p>}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="flex-shrink-0 ml-2 text-white/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded p-0.5 min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        ✕
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const push = useCallback((msg: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
    setToasts(prev => [...prev, { ...msg, id }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, push, dismiss }}>
      {children}
      <div
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 items-end"
      >
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
