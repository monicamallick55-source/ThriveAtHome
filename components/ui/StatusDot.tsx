export type StatusLevel = 'ok' | 'concern' | 'urgent' | 'emergency' | 'unknown'

export interface StatusDotProps {
  level: StatusLevel
  pulse?: boolean
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

const colorClasses: Record<StatusLevel, string> = {
  ok:        'bg-green-500',
  concern:   'bg-yellow-400',
  urgent:    'bg-orange-500',
  emergency: 'bg-red-600',
  unknown:   'bg-gray-400',
}

const ariaLabels: Record<StatusLevel, string> = {
  ok:        'Status: good',
  concern:   'Status: concern',
  urgent:    'Status: urgent',
  emergency: 'Status: emergency',
  unknown:   'Status: unknown',
}

const sizeClasses = { sm: 'w-2.5 h-2.5', md: 'w-3.5 h-3.5', lg: 'w-4 h-4' }

export function StatusDot({ level, pulse = false, label, size = 'md' }: StatusDotProps) {
  return (
    <span
      role="img"
      aria-label={label ?? ariaLabels[level]}
      className="inline-flex items-center gap-1.5"
    >
      <span className={`relative inline-flex rounded-full ${sizeClasses[size]} ${colorClasses[level]}`}>
        {pulse && level !== 'ok' && level !== 'unknown' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colorClasses[level]} opacity-60`} />
        )}
      </span>
      {label && <span className="text-base text-gray-700">{label}</span>}
    </span>
  )
}
