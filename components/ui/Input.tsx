'use client'

import { InputHTMLAttributes, forwardRef } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className = '', ...rest },
  ref
) {
  const inputId = id ?? `input-${label.toLowerCase().replace(/\s+/g, '-')}`
  const errorId = `${inputId}-error`
  const hintId  = `${inputId}-hint`

  const describedBy = [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-lg font-medium text-[var(--color-text-secondary)]">
        {label}
        {rest.required && <span className="text-[var(--color-urgent-text)] ml-1" aria-hidden="true">*</span>}
      </label>
      {hint && (
        <span id={hintId} className="text-sm text-[var(--color-text-muted)] -mt-1">{hint}</span>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-describedby={describedBy}
        aria-invalid={!!error}
        className={[
          'w-full h-14 px-4 text-base',
          'bg-white border-[1.5px] rounded-[var(--radius-md)]',
          'placeholder:text-[var(--color-warm-mid)]',
          'transition-all duration-200 outline-none',
          error
            ? 'border-[var(--color-urgent-border)] focus:border-[var(--color-urgent-border)] focus:ring-2 focus:ring-[var(--color-urgent-border)]/20'
            : 'border-[var(--color-warm-grey)] focus:border-[var(--color-teal)] focus:ring-2 focus:ring-[var(--color-teal)]/20',
          className,
        ].join(' ')}
        {...rest}
      />
      {error && (
        <span id={errorId} role="alert" className="text-sm text-[var(--color-urgent-text)] flex items-center gap-1 mt-0.5">
          <span aria-hidden="true">⚠</span> {error}
        </span>
      )}
    </div>
  )
})
