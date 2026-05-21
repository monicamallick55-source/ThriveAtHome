'use client'

import { SelectHTMLAttributes, forwardRef } from 'react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: SelectOption[]
  error?: string
  hint?: string
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, error, hint, placeholder, id, className = '', ...rest },
  ref
) {
  const selectId = id ?? `select-${label.toLowerCase().replace(/\s+/g, '-')}`
  const errorId  = `${selectId}-error`
  const hintId   = `${selectId}-hint`

  const describedBy = [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={selectId} className="text-lg font-medium text-[var(--color-text-secondary)]">
        {label}
        {rest.required && <span className="text-[var(--color-urgent-text)] ml-1" aria-hidden="true">*</span>}
      </label>
      {hint && (
        <span id={hintId} className="text-sm text-[var(--color-text-muted)] -mt-1">{hint}</span>
      )}
      <select
        ref={ref}
        id={selectId}
        aria-describedby={describedBy}
        aria-invalid={!!error}
        className={[
          'w-full h-14 px-4 text-base',
          'bg-white border-[1.5px] rounded-[var(--radius-md)]',
          'text-[var(--color-text-primary)]',
          'transition-all duration-200 outline-none appearance-none',
          'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%234A4640\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_12px_center] bg-[length:20px_20px] pr-10',
          error
            ? 'border-[var(--color-urgent-border)] focus:border-[var(--color-urgent-border)] focus:ring-2 focus:ring-[var(--color-urgent-border)]/20'
            : 'border-[var(--color-warm-grey)] focus:border-[var(--color-teal)] focus:ring-2 focus:ring-[var(--color-teal)]/20',
          className,
        ].join(' ')}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && (
        <span id={errorId} role="alert" className="text-sm text-[var(--color-urgent-text)] flex items-center gap-1 mt-0.5">
          <span aria-hidden="true">⚠</span> {error}
        </span>
      )}
    </div>
  )
})
