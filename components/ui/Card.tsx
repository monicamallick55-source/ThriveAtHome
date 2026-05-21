import { HTMLAttributes } from 'react'

export type CardVariant = 'default' | 'highlight' | 'warning' | 'danger' | 'emergency'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
}

const variantClasses: Record<CardVariant, string> = {
  default:   'bg-[var(--color-warm-white)] border border-[var(--color-warm-grey)] shadow-[var(--shadow-card)]',
  highlight: 'bg-[var(--color-teal-muted)] border-l-4 border-l-[var(--color-teal)] border border-[var(--color-warm-grey)] shadow-[var(--shadow-card)]',
  warning:   'bg-[var(--color-concern)] border-l-4 border-l-[var(--color-concern-border)] border border-[var(--color-concern-border)] shadow-[var(--shadow-card)]',
  danger:    'bg-[var(--color-urgent)] border-l-4 border-l-[var(--color-urgent-border)] border border-[var(--color-urgent-border)] shadow-[var(--shadow-card)]',
  emergency: 'bg-[var(--color-emergency)] border-2 border-[var(--color-urgent-border)] shadow-[var(--shadow-lg)] animate-pulse text-white',
}

export function Card({ variant = 'default', padding = 'md', children, className = '', ...rest }: CardProps) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mb-4 pb-4 border-b border-[var(--color-warm-grey)] ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`font-display text-xl font-medium text-[var(--color-navy)] ${className}`}>
      {children}
    </h2>
  )
}

export function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`text-base text-[var(--color-text-secondary)] ${className}`}>
      {children}
    </div>
  )
}
