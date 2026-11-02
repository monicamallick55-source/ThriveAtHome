// components/celebrations/BirthdayBanner.tsx
// G5.4 — Shows birthday banner on member/family dashboard when today is member's birthday
'use client'

interface Props {
  memberName: string
  dateOfBirth: string | null
  memberId: string
}

export function BirthdayBanner({ memberName, dateOfBirth, memberId }: Props) {
  if (!dateOfBirth) return null

  const today = new Date()
  const bday = new Date(dateOfBirth)
  const isBirthday = today.getMonth() === bday.getMonth() && today.getDate() === bday.getDate()
  const age = today.getFullYear() - bday.getFullYear()
  const daysUntil = (() => {
    const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
    if (thisYearBday < today) thisYearBday.setFullYear(today.getFullYear() + 1)
    return Math.round((thisYearBday.getTime() - today.getTime()) / 86400000)
  })()

  if (!isBirthday && daysUntil > 7) return null

  const name = memberName.split(' ')[0]

  return (
    <div className={`rounded-xl p-5 mb-6 flex items-center gap-4 ${
      isBirthday
        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
        : 'bg-amber-50 border border-amber-200 text-amber-900'
    }`}>
      <span className="text-4xl">{isBirthday ? '🎂' : '🎉'}</span>
      <div className="flex-1">
        {isBirthday ? (
          <>
            <p className="font-bold text-xl">Happy {age}th Birthday, {name}!</p>
            <p className="text-white/90 text-sm mt-0.5">Wishing you a wonderful day full of joy.</p>
          </>
        ) : (
          <>
            <p className="font-semibold">{name}'s birthday is in {daysUntil} day{daysUntil !== 1 ? 's' : ''}!</p>
            <p className="text-sm mt-0.5">
              <a href={`/dashboard/celebrations?member=${memberId}`} className="underline font-medium">
                Leave a birthday wish →
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
