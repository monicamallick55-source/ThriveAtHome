'use client'
import { useState } from 'react'

export function NationalResources() {
  const [zip, setZip] = useState('')

  const resources = [
    {
      name: 'Eldercare Locator',
      desc: 'Find local aging services by zip code',
      getUrl: (z: string) => z
        ? `https://eldercare.acl.gov/Public/Index.aspx?zip=${z}`
        : 'https://eldercare.acl.gov',
    },
    {
      name: '211 Helpline',
      desc: 'Local social services — food, housing, health, and more',
      getUrl: (z: string) => z
        ? `https://www.211.org/search?query=&location=${z}`
        : 'https://www.211.org',
    },
    {
      name: 'BenefitsCheckUp',
      desc: 'Find benefits you qualify for',
      getUrl: () => 'https://benefitscheckup.org',
    },
    {
      name: 'AARP Local Resources',
      desc: 'Community programs near you',
      getUrl: (z: string) => z
        ? `https://local.aarp.org/zip-code/${z}/`
        : 'https://local.aarp.org',
    },
    {
      name: 'Medicare Care Compare',
      desc: 'Compare local care providers',
      getUrl: () => 'https://www.medicare.gov/care-compare',
    },
    {
      name: 'VA Caregiver Support',
      desc: 'For veteran caregivers',
      getUrl: () => 'https://www.caregiver.va.gov',
    },
  ]

  return (
    <section className="bg-gray-50 rounded-xl p-6">
      <h2 className="font-semibold text-gray-900 mb-1">National Resources</h2>
      <p className="text-sm text-gray-500 mb-3">Enter your zip code to search directly in each resource.</p>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          inputMode="numeric"
          maxLength={5}
          placeholder="Enter zip code"
          value={zip}
          onChange={e => setZip(e.target.value.replace(/\D/g, ''))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:border-teal-400"
        />
        {zip.length === 5 && (
          <span className="text-teal-600 text-sm self-center">✓ Links updated</span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {resources.map(r => (
          <a
            key={r.name}
            href={r.getUrl(zip)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-teal-300 transition-colors"
          >
            <div>
              <p className="font-medium text-teal-700">{r.name}</p>
              <p className="text-gray-500 text-xs">{r.desc}</p>
              {zip.length === 5 && r.getUrl(zip) !== r.getUrl('') && (
                <p className="text-teal-500 text-xs mt-0.5">Searching near {zip} →</p>
              )}
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
