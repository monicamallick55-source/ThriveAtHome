import { HTMLAttributes } from 'react'

export type BadgeVariant = 'info' | 'concern' | 'urgent' | 'emergency' | 'success' | 'neutral'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  icon?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  info:      'bg-[var(--color-info)] text-[var(--color-info-text)]',
  concern:   'bg-[var(--color-concern)] text-[var(--color-concern-text)]',
  urgent:    'bg-[var(--color-urgent)] text-[var(--color-urgent-text)]',
  emergency: 'bg-[var(--color-emergency)] text-[var(--color-emergency-text)]',
  success:   'bg-[var(--color-teal-muted)] text-[var(--color-mood-high)]',
  neutral:   'bg-[var(--color-warm-grey)] text-[var(--color-text-secondary)]',
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
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-[var(--radius-sm)] text-sm font-medium ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  )
}
