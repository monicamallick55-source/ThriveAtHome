import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Find Local Help | ThriveAtHome' }

export default async function FindLocalHelpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const categories = [
    { label: 'Home Care Agencies', icon: '🏠', q: 'home care agencies seniors' },
    { label: 'Meal Delivery', icon: '🍽️', q: 'meal delivery seniors Meals on Wheels' },
    { label: 'Transportation', icon: '🚗', q: 'senior transportation non-emergency medical' },
    { label: 'Adult Day Programs', icon: '☀️', q: 'adult day care program seniors' },
    { label: 'Caregiver Respite', icon: '⏸️', q: 'caregiver respite care seniors' },
    { label: 'Legal Aid', icon: '⚖️', q: 'elder law legal aid seniors free' },
    { label: 'Home Repair Help', icon: '🔨', q: 'home repair assistance seniors low income' },
    { label: 'Mental Health', icon: '🧠', q: 'mental health counseling seniors' },
    { label: 'Medicaid Waivers', icon: '📋', q: 'Medicaid home care waiver program' },
    { label: 'Area Agency on Aging', icon: '🤝', q: 'Area Agency on Aging near me' },
    { label: 'Senior Centers', icon: '🎭', q: 'senior center programs near me' },
    { label: 'Food Assistance', icon: '🛒', q: 'SNAP food assistance seniors apply' },
  ]

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <Link href="/dashboard" className="text-sm text-teal-600 hover:text-teal-800 mb-6 inline-block">← Dashboard</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Find Local Help</h1>
      <p className="text-gray-600 mb-8">Click any category to search for services near you. Results open in Google so you can filter by your zip code.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        {categories.map(cat => (
          <a
            key={cat.label}
            href={`https://www.google.com/search?q=${encodeURIComponent(cat.q)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 border border-gray-200 rounded-xl p-5 hover:border-teal-300 hover:shadow-md transition-all text-center"
          >
            <span className="text-3xl">{cat.icon}</span>
            <span className="text-sm font-medium text-gray-800">{cat.label}</span>
          </a>
        ))}
      </div>

      <section className="bg-teal-50 rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-teal-900 mb-2">Free National Locators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            { name: 'Eldercare Locator', url: 'https://eldercare.acl.gov', desc: 'Find local aging services' },
            { name: 'BenefitsCheckUp', url: 'https://benefitscheckup.org', desc: 'Find benefits you qualify for' },
            { name: 'AARP Local Resources', url: 'https://local.aarp.org', desc: 'Community programs near you' },
            { name: 'Medicare Care Compare', url: 'https://www.medicare.gov/care-compare', desc: 'Compare local care providers' },
            { name: 'VA Caregiver Support', url: 'https://www.caregiver.va.gov', desc: 'For veteran caregivers' },
            { name: '211 Helpline', url: 'https://www.211.org', desc: 'Local social services hotline' },
          ].map(r => (
            <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-2 p-3 bg-white rounded-lg border border-teal-100 hover:border-teal-300 transition-colors">
              <div>
                <p className="font-medium text-teal-700">{r.name}</p>
                <p className="text-gray-500 text-xs">{r.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <div className="text-center">
        <Link href="/directory" className="inline-block bg-teal-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors">
          Browse ThriveAtHome Partner Directory →
        </Link>
      </div>
    </main>
  )
}
