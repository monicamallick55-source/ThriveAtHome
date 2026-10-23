import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Find Local Help | ThriveAtHome' }

export default async function FindLocalHelpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const g6Services = [
    {
      label: 'Home Safety Program',
      icon: '🏠',
      desc: 'Free home safety inspection, grab bars, smoke alarms, earthquake prep — done by trained volunteers.',
      href: '/dashboard/home-safety',
      cta: 'Enroll in program',
      color: 'border-teal-300 bg-teal-50',
    },
    {
      label: 'Home Sharing',
      icon: '🤝',
      desc: 'Rent out a spare room or find affordable housing through vetted local programs like HIP Housing.',
      href: '/dashboard/home-sharing',
      cta: 'Explore home sharing',
      color: 'border-blue-300 bg-blue-50',
    },
    {
      label: 'Encore Careers',
      icon: '💼',
      desc: 'Volunteer leadership, part-time paid work, SCSEP paid training, or start something new.',
      href: '/dashboard/encore-careers',
      cta: 'Find opportunities',
      color: 'border-purple-300 bg-purple-50',
    },
    {
      label: 'Community Campaigns',
      icon: '💛',
      desc: 'Ask the ThriveAtHome community for help with a specific need — equipment, repairs, groceries.',
      href: '/dashboard/campaigns',
      cta: 'See campaigns',
      color: 'border-yellow-300 bg-yellow-50',
    },
    {
      label: 'Partner Directory',
      icon: '🗂️',
      desc: 'Browse vetted local service providers — home care, meal delivery, transportation, and more.',
      href: '/directory',
      cta: 'Browse directory',
      color: 'border-gray-300 bg-gray-50',
    },
    {
      label: 'Resources by State',
      icon: '🗺️',
      desc: 'Medicaid waivers, Area Agency on Aging, legal aid, and food assistance in your state.',
      href: '/resources/states',
      cta: 'View state resources',
      color: 'border-green-300 bg-green-50',
    },
  ]

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <Link href="/dashboard" className="text-sm text-teal-600 hover:text-teal-800 mb-6 inline-block">← Dashboard</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Find Local Help</h1>
      <p className="text-gray-600 mb-8">Programs and services ThriveAtHome has vetted for you — warm referrals, navigator support, and community help.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {g6Services.map(svc => (
          <Link
            key={svc.label}
            href={svc.href}
            className={`flex flex-col gap-2 border rounded-xl p-5 hover:shadow-md transition-all ${svc.color}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{svc.icon}</span>
              <span className="font-semibold text-gray-900">{svc.label}</span>
            </div>
            <p className="text-sm text-gray-600">{svc.desc}</p>
            <span className="text-sm font-medium text-teal-700 mt-auto">{svc.cta} →</span>
          </Link>
        ))}
      </div>

      <section className="bg-gray-50 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-3">National Resources</h2>
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
              className="flex items-start gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-teal-300 transition-colors">
              <div>
                <p className="font-medium text-teal-700">{r.name}</p>
                <p className="text-gray-500 text-xs">{r.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}
