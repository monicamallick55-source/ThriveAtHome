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

const severityStyles: Record<ToastSeverity, { container: string; icon: string; border: string }> = {
  info:      { container: 'bg-[var(--color-cream)] text-[var(--color-text-primary)]',   icon: 'ℹ', border: 'border-l-4 border-l-[var(--color-navy)] border border-[var(--color-warm-grey)]' },
  success:   { container: 'bg-[var(--color-teal-muted)] text-[var(--color-text-primary)]', icon: '✓', border: 'border-l-4 border-l-[var(--color-teal)] border border-[var(--color-warm-grey)]' },
  concern:   { container: 'bg-[var(--color-concern)] text-[var(--color-concern-text)]', icon: '⚠', border: 'border-l-4 border-l-[var(--color-concern-border)] border border-[var(--color-concern-border)]' },
  urgent:    { container: 'bg-[var(--color-urgent)] text-[var(--color-urgent-text)]',   icon: '⚠', border: 'border-l-4 border-l-[var(--color-urgent-border)] border border-[var(--color-urgent-border)]' },
  emergency: { container: 'bg-[var(--color-emergency)] text-white',                      icon: '🚨', border: 'border-2 border-[var(--color-urgent-border)]' },
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const duration = toast.duration ?? 6000
    const timer = setTimeout(() => onDismiss(toast.id), duration)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onDismiss])

  const style = severityStyles[toast.severity]
  const isEmergency = toast.severity === 'emergency'

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={[
        'flex items-start gap-3 rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] p-4',
        isEmergency ? 'w-screen max-w-full text-center justify-center' : 'w-full max-w-[360px]',
        style.container,
        style.border,
      ].join(' ')}
    >
      <span className="text-xl mt-0.5 flex-shrink-0" aria-hidden="true">{style.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-base leading-snug">{toast.title}</p>
        {toast.body && <p className="text-sm opacity-80 mt-0.5">{toast.body}</p>}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="flex-shrink-0 ml-1 opacity-60 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-teal)] rounded-[var(--radius-sm)] p-1 min-h-[44px] min-w-[44px] flex items-center justify-center transition-opacity"
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
        className="fixed top-6 right-6 z-50 flex flex-col gap-2 items-end"
      >
        {toasts.map((t: any) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
