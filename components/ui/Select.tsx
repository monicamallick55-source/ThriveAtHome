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
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, error, placeholder, id, className = '', ...rest },
  ref
) {
  const selectId = id ?? `select-${label.toLowerCase().replace(/\s+/g, '-')}`
  const errorId  = `${selectId}-error`

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className="text-lg font-medium text-[#1B3A6B]">
        {label}
        {rest.required && <span className="text-red-600 ml-1" aria-hidden="true">*</span>}
      </label>
      <select
        ref={ref}
        id={selectId}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={!!error}
        className={`w-full rounded-lg border px-4 py-3 text-lg min-h-[52px] bg-white outline-none transition-colors
          ${error ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-gray-300 focus:ring-2 focus:ring-[#1B3A6B]'}
          ${className}`}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && (
        <span id={errorId} role="alert" className="text-base text-red-600 flex items-center gap-1">
          <span aria-hidden="true">⚠</span> {error}
        </span>
      )}
    </div>
  )
})
