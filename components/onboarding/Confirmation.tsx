'use client'
// Confirmation screen shown after successful onboarding submission.

interface Props {
  preferredName: string
  /** True when the signed-in user enrolled themselves — routes them to their own portal. */
  isSelf?: boolean
}

export function Confirmation({ preferredName, isSelf = false }: Props) {
  const destination = isSelf ? '/member-portal' : '/dashboard'
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
        <p className="text-gray-500 text-base leading-relaxed">
          {isSelf
            ? 'Aria will be in touch soon for your first check-in call. You can update these details any time from your portal.'
            : `Aria will be in touch soon for ${preferredName}'s first check-in call. You can update these details any time from the dashboard.`}
        </p>
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
