'use client'
// Confirmation screen shown after successful onboarding submission.
// Copy is context-aware: members who opted OUT of Aria never see AI branding here —
// they are told a human navigator will call. Members who opted IN see Aria named,
// alongside the navigator.

interface Props {
  preferredName: string
  /** True when the signed-in user enrolled themselves — routes them to their own portal. */
  isSelf?: boolean
  /** True only when the member chose to turn on Aria's calls during onboarding. */
  ariaOptedIn?: boolean
  /** Resolved call cadence — only meaningful when ariaOptedIn is true. */
  ariaFrequency?: 'daily' | 'every_other_day' | 'weekly'
}

function frequencyPhrase(freq: Props['ariaFrequency']): string {
  if (freq === 'every_other_day') return 'every other day'
  if (freq === 'weekly') return 'once a week'
  return 'each morning'
}

export function Confirmation({ preferredName, isSelf = false, ariaOptedIn = false, ariaFrequency = 'daily' }: Props) {
  const destination = isSelf ? '/member-portal' : '/dashboard'

  let body: string
  if (ariaOptedIn) {
    const phrase = frequencyPhrase(ariaFrequency)
    body = isSelf
      ? `Aria will call you ${phrase}, and your care navigator will also be in touch within 24 hours. You can update these details or change your call preferences any time from your portal.`
      : `Aria will call ${preferredName} ${phrase}, and a care navigator will also be in touch within 24 hours. You can update these details any time from the dashboard.`
  } else {
    body = isSelf
      ? 'Your care navigator will call you personally within 24 hours to welcome you and get you settled. You can update these details any time from your portal.'
      : `A care navigator will call ${preferredName} personally within 24 hours. You can update these details any time from the dashboard.`
  }

  return (
    <div className="flex flex-col items-center text-center gap-6 py-4">
      {/* Success icon */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
        style={{ backgroundColor: '#E6F4F6' }}
        aria-hidden="true"
      >
        ✓
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-2" style={{ color: '#1B3A6B' }}>
          {isSelf ? 'Your profile is ready' : `${preferredName}'s profile is ready`}
        </h2>
        <p className="text-gray-500 text-base leading-relaxed">{body}</p>
      </div>

      <button
        onClick={() => { window.location.href = destination }}
        className="w-full text-white font-semibold rounded-lg px-4 py-4 text-base text-center transition-opacity hover:opacity-90"
        style={{ backgroundColor: '#1B3A6B', minHeight: '52px', border: 'none', cursor: 'pointer' }}
      >
        {isSelf ? 'Go to my portal' : 'Go to dashboard'}
      </button>
    </div>
  )
}
