'use client'
// Confirmation screen shown after successful onboarding submission.
import Link from 'next/link'

interface Props {
  preferredName: string
}

export function Confirmation({ preferredName }: Props) {
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
          {preferredName}&apos;s profile is ready
        </h2>
        <p className="text-gray-500 text-base leading-relaxed">
          Aria will be in touch soon for {preferredName}&apos;s first check-in call.
          You can update these details any time from the dashboard.
        </p>
      </div>

      <Link
        href="/dashboard"
        className="w-full text-white font-semibold rounded-lg px-4 py-4 text-base text-center transition-opacity hover:opacity-90 inline-block"
        style={{ backgroundColor: '#1B3A6B', minHeight: '52px', lineHeight: '28px' }}
      >
        Go to dashboard
      </Link>
    </div>
  )
}
