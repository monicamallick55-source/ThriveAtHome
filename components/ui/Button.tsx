'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'teal' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-[var(--color-navy)] text-[var(--color-cream)] hover:bg-[var(--color-navy-dark)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] focus-visible:ring-[var(--color-teal)]',
  secondary: 'bg-transparent border-[1.5px] border-[var(--color-navy)] text-[var(--color-navy)] hover:border-[var(--color-teal)] hover:text-[var(--color-teal)] focus-visible:ring-[var(--color-teal)]',
  teal:      'bg-[var(--color-teal)] text-white hover:bg-[var(--color-teal-light)] focus-visible:ring-[var(--color-teal)]',
  ghost:     'bg-transparent text-[var(--color-navy)] hover:bg-[var(--color-warm-grey)] focus-visible:ring-[var(--color-teal)]',
  danger:    'bg-[var(--color-urgent-text)] text-white hover:opacity-90 focus-visible:ring-[var(--color-urgent-text)]',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-5 py-2 text-base  min-h-[44px]',
  md: 'px-6 py-3 text-lg   min-h-[56px]',
  lg: 'px-8 py-4 text-lg   min-h-[56px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, fullWidth = false, disabled, children, className = '', ...rest },
  ref
) {
  const base = [
    'inline-flex items-center justify-center gap-2',
    'font-medium font-body',
    'rounded-[var(--radius-md)]',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-60 disabled:cursor-not-allowed',
    'min-w-[56px]',
  ].join(' ')

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      className={`${base} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  )
})
