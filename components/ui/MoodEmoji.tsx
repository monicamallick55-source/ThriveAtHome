export interface MoodEmojiProps {
  score: number | null
  size?: 'sm' | 'md' | 'lg'
}

interface MoodInfo {
  emoji: string
  label: string
  bgClass: string
  textClass: string
}

export function getMoodEmoji(score: number | null): MoodInfo {
  if (score === null) return { emoji: '—', label: 'No check-in yet', bgClass: 'bg-[var(--color-warm-grey)]', textClass: 'text-[var(--color-warm-mid)]' }
  if (score >= 8)  return { emoji: '😊', label: 'Feeling great',    bgClass: 'bg-green-50',               textClass: 'text-green-800' }
  if (score >= 6)  return { emoji: '🙂', label: 'Feeling well',     bgClass: 'bg-[var(--color-teal-muted)]', textClass: 'text-[var(--color-teal)]' }
  if (score >= 4)  return { emoji: '😐', label: 'Feeling okay',     bgClass: 'bg-amber-50',               textClass: 'text-amber-700' }
  if (score >= 2)  return { emoji: '😔', label: 'Feeling low',      bgClass: 'bg-orange-50',              textClass: 'text-orange-700' }
  return               { emoji: '😞', label: 'Having a hard day', bgClass: 'bg-red-50',                textClass: 'text-red-700' }
}

const sizeClasses = {
  sm: { emoji: 'text-lg',  pill: 'px-2.5 py-1 text-sm gap-1.5 min-w-[120px]' },
  md: { emoji: 'text-2xl', pill: 'px-3 py-1.5 text-base gap-2 min-w-[160px]' },
  lg: { emoji: 'text-3xl', pill: 'px-4 py-2 text-lg gap-2.5 min-w-[180px]' },
}

export function MoodEmoji({ score, size = 'md' }: MoodEmojiProps) {
  const { emoji, label, bgClass, textClass } = getMoodEmoji(score)
  const sz = sizeClasses[size]

  return (
    <span
      role="img"
      aria-label={score !== null ? `${label} (${score}/10)` : label}
      className={`inline-flex items-center justify-center font-medium font-body rounded-[var(--radius-full)] ${bgClass} ${textClass} ${sz.pill}`}
    >
      <span aria-hidden="true" className={sz.emoji}>{emoji}</span>
      {score !== null && (
        <span className="font-mono font-medium">{score}/10</span>
      )}
      <span>{label}</span>
    </span>
  )
}
