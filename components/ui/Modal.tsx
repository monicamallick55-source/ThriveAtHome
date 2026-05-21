'use client'

import { useEffect } from 'react'
import FocusTrap from 'focus-trap-react'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export function Modal({ open, onClose, title, description, children, size = 'md' }: ModalProps) {
  const titleId = `modal-title-${title.replace(/\s+/g, '-').toLowerCase()}`
  const descId  = `modal-desc-${title.replace(/\s+/g, '-').toLowerCase()}`

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-[var(--color-navy)]/40 backdrop-blur-[2px]"
        aria-hidden="true"
        onClick={onClose}
      />
      <FocusTrap
        focusTrapOptions={{
          initialFocus: false,
          returnFocusOnDeactivate: true,
          clickOutsideDeactivates: false,
          escapeDeactivates: false,
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          className={`relative bg-[var(--color-warm-white)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] border border-[var(--color-warm-grey)] w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`}
        >
          <div className="flex items-center justify-between p-6 border-b border-[var(--color-warm-grey)]">
            <h2 id={titleId} className="font-display text-xl font-medium text-[var(--color-navy)]">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-[var(--radius-md)] p-2 text-[var(--color-text-muted)] hover:text-[var(--color-navy)] hover:bg-[var(--color-warm-grey)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-teal)] focus-visible:ring-offset-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition-all duration-200"
            >
              <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {description && (
            <p id={descId} className="px-6 pt-4 text-base text-[var(--color-text-muted)]">{description}</p>
          )}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </div>
      </FocusTrap>
    </div>
  )
}
