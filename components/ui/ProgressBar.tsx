export interface ProgressBarProps {
  value: number
  max?: number
  label: string
  showValue?: boolean
  color?: 'navy' | 'teal' | 'green' | 'yellow' | 'red'
  size?: 'sm' | 'md' | 'lg'
}

const colorClasses = {
  navy:   'bg-[#1B3A6B]',
  teal:   'bg-[#2A9D8F]',
  green:  'bg-green-500',
  yellow: 'bg-yellow-400',
  red:    'bg-red-600',
}

const sizeClasses = { sm: 'h-2', md: 'h-3', lg: 'h-4' }

export function ProgressBar({ value, max = 100, label, showValue = false, color = 'teal', size = 'md' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-base font-medium text-gray-700">{label}</span>
        {showValue && (
          <span className="text-base text-gray-500" aria-hidden="true">{Math.round(pct)}%</span>
        )}
      </div>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label}: ${Math.round(pct)}%`}
        className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClasses[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
