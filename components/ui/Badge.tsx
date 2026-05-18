import { HTMLAttributes } from 'react'

export type BadgeVariant = 'info' | 'concern' | 'urgent' | 'emergency' | 'success' | 'neutral'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  icon?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  info:      'bg-blue-100 text-blue-800',
  concern:   'bg-yellow-100 text-yellow-800',
  urgent:    'bg-orange-100 text-orange-800',
  emergency: 'bg-red-100 text-red-800',
  success:   'bg-green-100 text-green-800',
  neutral:   'bg-gray-100 text-gray-700',
}

const variantLabels: Record<BadgeVariant, string> = {
  info: 'info', concern: 'concern', urgent: 'urgent',
  emergency: 'emergency', success: 'success', neutral: 'neutral',
}

export function Badge({ variant = 'neutral', icon, children, className = '', ...rest }: BadgeProps) {
  return (
    <span
      role="status"
      aria-label={`${variantLabels[variant]}: ${typeof children === 'string' ? children : ''}`}
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-base font-medium ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  )
}
