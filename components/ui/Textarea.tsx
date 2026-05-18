'use client'

import { TextareaHTMLAttributes, forwardRef } from 'react'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, id, className = '', ...rest },
  ref
) {
  const textareaId = id ?? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`
  const errorId    = `${textareaId}-error`
  const hintId     = `${textareaId}-hint`

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={textareaId} className="text-lg font-medium text-[#1B3A6B]">
        {label}
        {rest.required && <span className="text-red-600 ml-1" aria-hidden="true">*</span>}
      </label>
      {hint && <span id={hintId} className="text-base text-gray-500">{hint}</span>}
      <textarea
        ref={ref}
        id={textareaId}
        aria-describedby={[hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined}
        aria-invalid={!!error}
        className={`w-full rounded-lg border px-4 py-3 text-lg outline-none transition-colors resize-y min-h-[100px]
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
