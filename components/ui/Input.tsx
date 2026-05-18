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

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-lg font-medium text-[#1B3A6B]">
        {label}
        {rest.required && <span className="text-red-600 ml-1" aria-hidden="true">*</span>}
      </label>
      {hint && <span id={hintId} className="text-base text-gray-500">{hint}</span>}
      <input
        ref={ref}
        id={inputId}
        aria-describedby={[hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined}
        aria-invalid={!!error}
        className={`w-full rounded-lg border px-4 py-3 text-lg min-h-[52px] outline-none transition-colors
          ${error ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-gray-300 focus:ring-2 focus:ring-[#1B3A6B]'}
          ${className}`}
        {...rest}
      />
      {error && (
        <span id={errorId} role="alert" className="text-base text-red-600 flex items-center gap-1">
          <span aria-hidden="true">⚠</span> {error}
        </span>
      )}
    </div>
  )
})
