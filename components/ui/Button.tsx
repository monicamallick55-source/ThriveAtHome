'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-[#1B3A6B] text-white hover:bg-[#2A5298] focus-visible:ring-[#1B3A6B]',
  secondary: 'bg-[#2A9D8F] text-white hover:bg-[#3DBFB0] focus-visible:ring-[#2A9D8F]',
  outline:   'border-2 border-[#1B3A6B] text-[#1B3A6B] hover:bg-[#1B3A6B] hover:text-white focus-visible:ring-[#1B3A6B]',
  ghost:     'text-[#1B3A6B] hover:bg-gray-100 focus-visible:ring-[#1B3A6B]',
  danger:    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-base min-h-[44px]',
  md: 'px-6 py-3 text-lg min-h-[52px]',
  lg: 'px-8 py-4 text-xl min-h-[60px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, fullWidth = false, disabled, children, className = '', ...rest },
  ref
) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
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
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  )
})
