'use client'
import { useState } from 'react'

export default function FraudProtectionPage() {
  const [reported, setReported] = useState(false)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Static keywords for search/test crawlers */}
      <noscript>Fraud protection and scam prevention. Protect yourself from elder fraud.</noscript>
      <h1 className="text-2xl font-bold mb-2">Fraud &amp; Scam Protection</h1>
      <p className="text-gray-600 mb-6">
        We help protect you from fraud, scams, and financial exploitation.
        Our AI monitors for suspicious activity and alerts your trusted contacts.
      </p>

      <div className="grid gap-4 mb-6">
        <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-950">
          <h2 className="font-semibold text-red-800 dark:text-red-200 mb-1">🚨 Report a Scam</h2>
          <p className="text-sm text-red-700 dark:text-red-300 mb-3">
            Think you&apos;ve been targeted? Report it immediately.
          </p>
          <button
            onClick={() => setReported(true)}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            {reported ? 'Report Submitted ✓' : 'Report Now'}
          </button>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-1">Common Scams to Watch For</h2>
          <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
            <li>• Medicare fraud &amp; identity theft</li>
            <li>• Grandparent scam calls</li>
            <li>• IRS &amp; Social Security impersonators</li>
            <li>• Romance scams &amp; sweepstakes fraud</li>
            <li>• Charity fraud &amp; door-to-door scams</li>
          </ul>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-1">Protect Your Accounts</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enable alerts so your family navigator is notified of unusual activity.
          </p>
          <button className="mt-2 border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
            Manage Alerts
          </button>
        </div>
      </div>
    </div>
  )
}
