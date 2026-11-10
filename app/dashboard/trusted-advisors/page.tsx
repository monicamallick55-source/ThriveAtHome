'use client'
import { useState, useEffect } from 'react'

type Advisor = { id: string; name: string; specialty: string; bio: string; telehealth: boolean }

const SPECIALTY_LABELS: Record<string, string> = {
  elder_law_attorney: 'Elder Law Attorney',
  financial_planner: 'Financial Planner',
  geriatric_care_manager: 'Geriatric Care Manager',
  licensed_therapist: 'Licensed Therapist',
  chaplain: 'Chaplain / Spiritual Care',
  grief_counselor: 'Grief Counselor',
  social_worker: 'Social Worker',
  pharmacist: 'Pharmacist',
}

export default function TrustedAdvisorsPage() {
  const [advisors, setAdvisors] = useState<Advisor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/trusted-advisors')
      .then(r => r.json())
      .then(d => setAdvisors(d.advisors || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Trusted Advisors</h1>
      <p className="text-gray-600 mb-6">Connect with vetted professionals who specialize in elder care and senior support.</p>
      {loading ? (
        <p className="text-gray-400">Loading advisors...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {advisors.map(a => (
            <div key={a.id} className="border border-gray-200 rounded-lg p-4">
              <h2 className="font-semibold">{a.name}</h2>
              <p className="text-sm text-blue-600 mb-2">{SPECIALTY_LABELS[a.specialty] || a.specialty}</p>
              <p className="text-sm text-gray-600">{a.bio}</p>
              {a.telehealth && <span className="mt-2 inline-block text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Telehealth available</span>}
              <button className="mt-3 w-full bg-blue-600 text-white rounded px-3 py-2 text-sm">Request Consultation</button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
