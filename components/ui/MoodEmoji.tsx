export interface MoodEmojiProps {
  score: number | null
  showScore?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = { sm: 'text-xl', md: 'text-2xl', lg: 'text-4xl' }

export function getMoodEmoji(score: number | null): { emoji: string; label: string } {
  if (score === null) return { emoji: '—', label: 'No mood score' }
  if (score >= 9) return { emoji: '😊', label: 'Excellent mood' }
  if (score >= 7) return { emoji: '🙂', label: 'Good mood' }
  if (score >= 5) return { emoji: '😐', label: 'Neutral mood' }
  if (score >= 3) return { emoji: '😔', label: 'Low mood' }
  return { emoji: '😢', label: 'Very low mood' }
}

export function MoodEmoji({ score, showScore = false, size = 'md' }: MoodEmojiProps) {
  const { emoji, label } = getMoodEmoji(score)
  return (
    <span
      role="img"
      aria-label={score !== null ? `${label} (${score}/10)` : label}
      className={`inline-flex items-center gap-1 ${sizeClasses[size]}`}
      title={score !== null ? `Mood: ${score}/10` : 'No mood recorded'}
    >
      {emoji}
      {showScore && score !== null && (
        <span className="text-base font-medium text-gray-700">{score}/10</span>
      )}
    </span>
  )
}
