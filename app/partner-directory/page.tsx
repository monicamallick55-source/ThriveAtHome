'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CATEGORIES = [
  {
    slug: 'accessibility-experts',
    icon: '♿',
    title: 'Accessibility Experts',
    description: 'Home modifications to keep you safe and independent.',
    subcategories: [
      'Wheelchair ramp installation',
      'Zero-step entries & thresholds',
      'Slip-resistant surface installation',
      'Grab bar & handrail installation',
      'Stair lift installation',
      'Doorway widening',
      'Walk-in tub & shower conversion',
      'ADA bathroom remodeling',
    ],
  },
  {
    slug: 'caregivers',
    icon: '🤲',
    title: 'In-Home Caregivers',
    description: 'Personal care, companionship, and daily living assistance at home.',
    subcategories: [
      'Personal care & hygiene assistance',
      'Meal preparation',
      'Medication reminders',
      'Light housekeeping',
      'Companionship visits',
      'Errands & transportation',
      'Overnight care',
      'Skilled nursing (RN/LPN)',
      'Physical therapy at home',
      'Memory care support',
    ],
  },
  {
    slug: 'house-cleaners',
    icon: '🧹',
    title: 'House Cleaners',
    description: 'Regular and deep-cleaning services for a healthy home.',
    subcategories: [
      'Weekly / bi-weekly cleaning',
      'Deep cleaning',
      'Move-in / move-out cleaning',
      'Post-construction cleaning',
      'Window cleaning',
      'Carpet & upholstery cleaning',
      'Eco-friendly cleaning',
    ],
  },
  {
    slug: 'home-organizers',
    icon: '📦',
    title: 'Professional Organizers',
    description: 'Declutter, downsize, and create organized, safe living spaces.',
    subcategories: [
      'Whole-home decluttering',
      'Downsizing support',
      'Estate clearing',
      'Closet & storage organization',
      'Paper & document organization',
      'Kitchen organization',
      'Garage & basement organization',
      'Senior move management',
    ],
  },
  {
    slug: 'junk-removal',
    icon: '🗑️',
    title: 'Junk Removal & Decluttering',
    description: 'Haul away unwanted items quickly and responsibly.',
    subcategories: [
      'Furniture removal',
      'Appliance removal & recycling',
      'Estate cleanout',
      'Basement & garage cleanout',
      'Donation drop-off coordination',
      'E-waste disposal',
    ],
  },
  {
    slug: 'moving-companies',
    icon: '🚛',
    title: 'Moving Companies',
    description: 'Senior-specialized moving services for local and long-distance moves.',
    subcategories: [
      'Local residential moves',
      'Long-distance moves',
      'Senior move specialists',
      'Packing & unpacking services',
      'Furniture assembly & placement',
      'Storage solutions',
      'Piano & specialty item moving',
    ],
  },
  {
    slug: 'remodeling',
    icon: '🔨',
    title: 'Remodeling & Construction',
    description: 'Home renovation to improve safety, comfort, and aging in place.',
    subcategories: [
      'Bathroom remodeling for seniors',
      'Kitchen remodeling',
      'Addition & room conversion',
      'Flooring replacement',
      'Roofing & siding',
      'Window & door replacement',
      'Deck & patio construction',
      'General handyman services',
    ],
  },
  {
    slug: 'concrete-services',
    icon: '🏗️',
    title: 'Concrete & Exterior Access',
    description: 'Exterior modifications for safer entry and driveway access.',
    subcategories: [
      'Concrete ramp installation',
      'Zero-step driveway & walkway grading',
      'Slip-resistant surface coating',
      'Driveway widening',
      'Sidewalk repair & leveling',
      'Curb cut installation',
      'Patio resurfacing',
    ],
  },
  {
    slug: 'hvac',
    icon: '❄️',
    title: 'HVAC Services',
    description: 'Heating, cooling, and air quality for a comfortable, healthy home.',
    subcategories: [
      'Furnace installation & repair',
      'Central air conditioning',
      'Mini-split / ductless systems',
      'Air quality & filtration',
      'Duct cleaning',
      'Thermostat & smart controls',
      'Annual maintenance plans',
    ],
  },
  {
    slug: 'financial-advisors',
    icon: '💰',
    title: 'Financial Advisors',
    description: 'Retirement income planning, benefits optimization, and elder financial guidance.',
    subcategories: [
      'Retirement income planning',
      'Social Security optimization',
      'Medicare & Medicaid planning',
      'Long-term care insurance',
      'Estate planning coordination',
      'Elder financial abuse prevention',
      'Benefits enrollment assistance',
    ],
  },
  {
    slug: 'life-coaches',
    icon: '🌱',
    title: 'Life Coaches',
    description: 'Purpose, fulfillment, and transition coaching for life after retirement.',
    subcategories: [
      'Retirement transition coaching',
      'Purpose & meaning coaching',
      'Grief & loss support',
      'Health & wellness coaching',
      'Relationship coaching',
      'Career encore coaching',
      'Life review & legacy work',
    ],
  },
  {
    slug: 'career-coaching',
    icon: '💼',
    title: 'Career Coaching',
    description: 'Support for seniors re-entering the workforce or pursuing encore careers.',
    subcategories: [
      'Encore career planning',
      'Resume & LinkedIn updating',
      'Interview coaching',
      'Freelance & consulting setup',
      'Part-time job search',
      'Volunteer leadership roles',
      'Skills assessment',
    ],
  },
]

function ReferralForm({
  category,
  onSend,
  onCancel,
}: {
  category: string
  onSend: () => void
  onCancel: () => void
}) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/directory/referral-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, note }),
      })
    } catch {
      // Silently fail — navigator follows up via dashboard
    }
    setLoading(false)
    onSend()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-teal-50 border border-teal-200 rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-teal-900 text-sm">Request a {category} referral</h3>
      <div>
        <label className="block text-xs font-medium text-teal-800 mb-1.5">
          Any details for your Navigator?{' '}
          <span className="text-teal-600 font-normal">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder={`e.g. "I need a grab bar installed in my bathroom — I live in Portland, OR"`}
          className="w-full px-3 py-2 rounded-lg border border-teal-200 text-gray-900 text-sm placeholder-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none bg-white"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-teal-600 text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-teal-700 disabled:opacity-60 transition-colors"
        >
          {loading ? 'Sending…' : 'Send to my Navigator'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
        >
          Cancel
        </button>
      </div>
      <p className="text-xs text-teal-700">
        Not a member yet?{' '}
        <Link href="/signup" className="underline font-medium">
          Sign up free
        </Link>{' '}
        — your Navigator will follow up within one business day.
      </p>
    </form>
  )
}

export default function PartnerDirectoryPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetch("/api/auth/me").then(r => {
      if (!r.ok) router.replace("/login?next=/partner-directory")
      else setChecking(false)
    }).catch(() => router.replace("/login?next=/partner-directory"))
  }, [])

  if (checking) return <div style={{minHeight:"60vh",display:"flex",alignItems:"center",justifyContent:"center"}}>Loading...</div>

  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [referralCategory, setReferralCategory] = useState<string | null>(null)
  const [referralSent, setReferralSent] = useState<Record<string, boolean>>({})

  const filtered = CATEGORIES.filter(cat => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      cat.title.toLowerCase().includes(q) ||
      cat.description.toLowerCase().includes(q) ||
      cat.subcategories.some(s => s.toLowerCase().includes(q))
    )
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-teal-700">ThriveAtHome</Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/resources" className="text-gray-600 hover:text-teal-700">Resources</Link>
            <Link href="/blog" className="text-gray-600 hover:text-teal-700">Blog</Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-teal-700">Dashboard</Link>
            <Link
              href="/signup"
              className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 font-medium"
            >
              Sign up free
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 text-sm font-medium px-3 py-1.5 rounded-full mb-4">
            <span>📍</span> Local Partner Directory
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Find trusted local help</h1>
          <p className="text-lg text-gray-500 max-w-2xl">
            Browse 12 categories of vetted local service providers. Your Care Navigator can connect
            you with the right person for your situation — at no extra cost to members.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search services (e.g. 'ramp', 'caregiver', 'moving')…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-10 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              ×
            </button>
          )}
        </div>

        {/* Navigator banner */}
        <div className="bg-teal-700 rounded-2xl p-6 mb-10 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
          <div>
            <p className="text-white font-semibold text-lg mb-1">Not sure where to start?</p>
            <p className="text-teal-100 text-sm">
              Your Care Navigator knows your situation and can recommend the right provider — often
              within the same day.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="shrink-0 bg-white text-teal-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-teal-50 transition-colors text-sm"
          >
            Message my Navigator →
          </Link>
        </div>

        {/* Count */}
        {search && (
          <p className="text-sm text-gray-500 mb-4">
            {filtered.length === 0
              ? 'No categories match your search.'
              : `${filtered.length} categor${filtered.length === 1 ? 'y' : 'ies'} found`}
          </p>
        )}

        {/* Categories */}
        <div className="space-y-4">
          {filtered.map(cat => (
            <div key={cat.slug} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Header button */}
              <button
                onClick={() => setExpanded(expanded === cat.slug ? null : cat.slug)}
                className="w-full text-left px-6 py-5 flex items-start gap-4 hover:bg-gray-50 transition-colors"
              >
                <span className="text-3xl shrink-0 mt-0.5">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-900 text-lg leading-snug">{cat.title}</h2>
                  <p className="text-gray-500 text-sm mt-1">{cat.description}</p>
                  <p className="text-teal-600 text-xs font-medium mt-2">
                    {cat.subcategories.length} services ·{' '}
                    <span className="underline">{expanded === cat.slug ? 'hide' : 'view all'}</span>
                  </p>
                </div>
                <span className="text-gray-400 text-xl shrink-0 mt-1">
                  {expanded === cat.slug ? '▲' : '▼'}
                </span>
              </button>

              {/* Expanded content */}
              {expanded === cat.slug && (
                <div className="border-t border-gray-100 px-6 py-5">
                  <div className="flex flex-wrap gap-2 mb-5">
                    {cat.subcategories.map(sub => (
                      <span
                        key={sub}
                        className="bg-gray-50 border border-gray-200 text-gray-700 text-sm px-3 py-1.5 rounded-lg"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>

                  {referralSent[cat.slug] ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                      <p className="text-green-800 font-semibold mb-1">✅ Request sent!</p>
                      <p className="text-green-700 text-sm">
                        Your Navigator will follow up within one business day with local
                        recommendations.
                      </p>
                      <button
                        onClick={() =>
                          setReferralSent(prev => ({ ...prev, [cat.slug]: false }))
                        }
                        className="mt-3 text-sm text-green-700 underline"
                      >
                        Close
                      </button>
                    </div>
                  ) : referralCategory === cat.slug ? (
                    <ReferralForm
                      category={cat.title}
                      onSend={() => {
                        setReferralSent(prev => ({ ...prev, [cat.slug]: true }))
                        setReferralCategory(null)
                      }}
                      onCancel={() => setReferralCategory(null)}
                    />
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setReferralCategory(cat.slug)}
                        className="bg-teal-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-teal-700 transition-colors"
                      >
                        Request a local referral
                      </button>
                      <Link
                        href="/dashboard"
                        className="border border-gray-200 text-gray-700 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-center"
                      >
                        Message my Navigator
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && search && (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-gray-600 font-medium mb-2">No results for &ldquo;{search}&rdquo;</p>
            <p className="text-gray-400 text-sm mb-6">
              Try a different term, or ask your Navigator — they know every local resource.
            </p>
            <Link
              href="/dashboard"
              className="bg-teal-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-teal-700 transition-colors"
            >
              Ask my Navigator
            </Link>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-14 bg-gray-900 rounded-2xl p-8 text-center">
          <p className="text-white text-2xl font-bold mb-2">Your Navigator handles the search for you</p>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            Members get a dedicated Care Navigator who vets providers, coordinates appointments, and
            follows up — so you don&apos;t have to manage it alone.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="bg-teal-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-teal-400 transition-colors"
            >
              Join free — get a Navigator
            </Link>
            <Link
              href="/dashboard"
              className="border border-gray-600 text-gray-300 font-medium px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Already a member →
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 mt-16 py-8 text-center text-sm text-gray-400">
        <div className="flex flex-wrap justify-center gap-6 mb-3">
          <Link href="/resources" className="hover:text-gray-600">Resources</Link>
          <Link href="/blog" className="hover:text-gray-600">Blog</Link>
          <Link href="/for-organizations" className="hover:text-gray-600">Organizations</Link>
          <Link href="/privacy" className="hover:text-gray-600">Privacy</Link>
          <Link href="/contact" className="hover:text-gray-600">Contact</Link>
        </div>
        <p>© 2026 ThriveAtHome. All rights reserved.</p>
      </footer>
    </div>
  )
}
