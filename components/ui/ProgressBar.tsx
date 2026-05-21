export interface ProgressBarProps {
  value: number
  max?: number
  label: string
  showValue?: boolean
  color?: 'navy' | 'teal' | 'green' | 'amber' | 'red'
  size?: 'sm' | 'md' | 'lg'
}

const colorClasses = {
  navy:  'bg-[var(--color-navy)]',
  teal:  'bg-[var(--color-teal)]',
  green: 'bg-[var(--color-mood-high)]',
  amber: 'bg-[var(--color-concern-border)]',
  red:   'bg-[var(--color-urgent-text)]',
}

const sizeClasses = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' }

export function ProgressBar({ value, max = 100, label, showValue = false, color = 'teal', size = 'md' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-base font-medium text-[var(--color-text-secondary)]">{label}</span>
        {showValue && (
          <span className="text-sm font-mono text-[var(--color-text-muted)]" aria-hidden="true">{Math.round(pct)}%</span>
        )}
      </div>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label}: ${Math.round(pct)}%`}
        className={`w-full bg-[var(--color-warm-grey)] rounded-full overflow-hidden ${sizeClasses[size]}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClasses[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
