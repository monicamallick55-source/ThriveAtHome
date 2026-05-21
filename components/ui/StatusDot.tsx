export type StatusLevel = 'no_alerts' | 'informational' | 'concern' | 'urgent' | 'emergency'

export interface StatusDotProps {
  level: StatusLevel
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const dotColorClasses: Record<StatusLevel, string> = {
  no_alerts:     'bg-[var(--color-mood-high)]',
  informational: 'bg-[var(--color-navy-light)]',
  concern:       'bg-[var(--color-concern-border)]',
  urgent:        'bg-[var(--color-urgent-border)]',
  emergency:     'bg-[var(--color-urgent-text)]',
}

const labelText: Record<StatusLevel, string> = {
  no_alerts:     'All good',
  informational: 'Note',
  concern:       'Attention',
  urgent:        'Urgent',
  emergency:     'Emergency',
}

const textColorClasses: Record<StatusLevel, string> = {
  no_alerts:     'text-[var(--color-mood-high)]',
  informational: 'text-[var(--color-navy-light)]',
  concern:       'text-[var(--color-concern-text)]',
  urgent:        'text-[var(--color-urgent-text)]',
  emergency:     'text-[var(--color-urgent-text)]',
}

const pulseStates: StatusLevel[] = ['concern', 'urgent', 'emergency']

const dotSizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3.5 h-3.5',
}

export function StatusDot({ level, size = 'md', className = '' }: StatusDotProps) {
  const label = labelText[level]
  const shouldPulse = pulseStates.includes(level)

  return (
    <span
      role="img"
      aria-label={`Status: ${label}`}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <span className={`relative inline-flex rounded-full flex-shrink-0 ${dotSizeClasses[size]} ${dotColorClasses[level]}`}>
        {shouldPulse && (
          <span
            aria-hidden="true"
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColorClasses[level]} opacity-50`}
          />
        )}
      </span>
      <span className={`text-sm font-medium ${textColorClasses[level]}`}>
        {label}
      </span>
    </span>
  )
}
