// app/for-organizations/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, ArrowRight, Building2, Users, Heart, Globe, Cpu, ChevronDown } from 'lucide-react'

const CHANNELS = [
  {
    icon: '🏘️',
    label: 'Village Networks',
    pattern: 'Back-Office',
    desc: 'Your volunteers, your members, your identity — powered by ThriveAtHome\'s coordination platform underneath. Replaces spreadsheets and phone trees with AI dispatch.',
    includes: ['Member portal & family dashboard', 'Volunteer dispatch & scheduling', 'Quinn AI as your named concierge', 'Ride coordination & meal referrals', 'Service request tracking'],
    price: 'From $50/mo',
  },
  {
    icon: '🏛️',
    label: 'Area Agencies on Aging',
    pattern: 'Back-Office',
    desc: 'Extend your reach without adding staff. Automate intake, benefits screening, and follow-up. Serve more seniors with the same team.',
    includes: ['Automated intake & eligibility screening', 'SHIP benefits navigation built in', 'Care plan documentation', 'Outcome reporting for funders', 'Referral tracking & warm handoffs'],
    price: 'From $50/mo',
  },
  {
    icon: '🏥',
    label: 'Hospitals & Health Systems',
    pattern: 'Back-Office',
    desc: 'Reduce 30-day readmissions. Quinn checks in daily post-discharge, escalates to care teams, and coordinates transportation and meal delivery during recovery.',
    includes: ['Discharge follow-up call automation', 'Fall risk daily monitoring', 'Transportation to follow-up appointments', 'Family alert system', 'EHR-compatible outcome reports'],
    price: 'From $50/mo',
  },
  {
    icon: '💼',
    label: 'Employers',
    pattern: 'Coordinator',
    desc: 'Elder care is the #1 hidden productivity drain. Give employees a solution for aging parents — reduces absenteeism, increases retention.',
    includes: ['Employee family benefit — ThriveAtHome for their senior parent', 'Family dashboard for employees', 'Quinn handles all coordination', 'Quarterly utilization report', 'SHRM-approved caregiver benefit'],
    price: 'From $50/mo',
  },
  {
    icon: '⚕️',
    label: 'Medicare Advantage Plans',
    pattern: 'Coordinator',
    desc: 'SSBCI-compliant supplemental benefit. Proven daily touchpoint that generates outcome data. Aria calls are documentable health touchpoints.',
    includes: ['Daily Aria check-in calls (documentable)', 'Social determinants screening', 'Clinical outcome reporting', 'White-label under your plan brand', 'Member-facing Quinn as plan concierge'],
    price: 'From $50/mo',
  },
  {
    icon: '🔄',
    label: 'PACE Programs',
    pattern: 'Back-Office',
    desc: 'Supplement your PACE team between center visits. Quinn checks in daily, monitors for changes, and escalates before the next scheduled visit.',
    includes: ['Between-visit monitoring', 'Daily check-in call documentation', 'Family communication layer', 'Service coordination support', 'Integration with care plan workflows'],
    price: 'From $50/mo',
  },
]

const PATTERN_A = [
  'Quinn introduces herself under your brand name',
  'Seniors call one number — Quinn handles everything',
  'Your team receives escalations, not routine calls',
  'Family dashboard branded to your organization',
  'All coordination visible in your admin portal',
]

const PATTERN_B = [
  'Your existing workflows stay — ThriveAtHome plugs in underneath',
  'Volunteer portal replaces your coordination spreadsheets',
  'Member data stays yours — ThriveAtHome is the operating system',
  'API access for EHR and case management integrations',
  'White-label at every touchpoint — members see your brand',
]

const ORG_TYPES = [
  'Village network / Village to Village affiliate',
  'Area Agency on Aging',
  'Hospital / health system',
  'Employer / HR benefits',
  'Medicare Advantage plan',
  'PACE program',
  'Nonprofit / community org',
  'Other',
]

export default function ForOrganizationsPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    org_name: '',
    contact_name: '',
    email: '',
    phone: '',
    org_type: '',
    members: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/b2b-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setSubmitted(true)
    } catch {
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 py-20 px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-teal-400/10 text-teal-400 text-sm font-semibold px-4 py-2 rounded-full mb-6">
          <Building2 className="w-4 h-4" />
          For Organizations
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight max-w-3xl mx-auto">
          The platform behind every<br className="hidden md:block" /> senior independence program
        </h1>
        <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-8">
          Village networks, Area Agencies on Aging, hospitals, employers, and Medicare Advantage plans
          use ThriveAtHome as the coordination layer that makes their programs work — under their brand.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#demo"
            className="bg-teal-500 text-white font-bold px-8 py-4 rounded-xl hover:bg-teal-400 transition"
          >
            Request a demo
          </a>
          <a
            href="#channels"
            className="border border-slate-500 text-slate-300 font-semibold px-8 py-4 rounded-xl hover:border-white hover:text-white transition"
          >
            See your channel
          </a>
        </div>
      </section>

      {/* Two Patterns */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-teal-600 font-semibold text-sm uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Two ways to deploy</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Every organization is different. ThriveAtHome fits two proven patterns — you choose which fits your setup.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Pattern A */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-teal-100 rounded-xl p-2.5">
                  <Cpu className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Pattern A</p>
                  <p className="font-bold text-gray-900">Quinn as Coordinator</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Quinn becomes your organization's named AI concierge. Seniors call one number.
                Quinn handles intake, service coordination, check-ins, and family updates — your team only
                sees escalations that need a human. Best for: employers, MA plans, smaller villages.
              </p>
              <div className="space-y-2.5">
                {PATTERN_A.map((f) => (
                  <div key={f} className="flex gap-2.5 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Pattern B */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-slate-100 rounded-xl p-2.5">
                  <Globe className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Pattern B</p>
                  <p className="font-bold text-gray-900">Platform as Back-Office</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Your organization keeps its identity and member relationships. ThriveAtHome runs the
                coordination infrastructure — volunteer dispatch, ride booking, benefits screening, family
                portal — invisibly underneath. Best for: village networks, AAAs, hospitals, PACE.
              </p>
              <div className="space-y-2.5">
                {PATTERN_B.map((f) => (
                  <div key={f} className="flex gap-2.5 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Channel Cards */}
      <section className="py-20 px-4" id="channels">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Your channel</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              ThriveAtHome is built for how each channel actually operates — not a generic platform that sort of fits.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {CHANNELS.map((ch) => (
              <div key={ch.label} className="border border-gray-200 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{ch.icon}</span>
                    <div>
                      <p className="font-bold text-gray-900">{ch.label}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        ch.pattern === 'Back-Office'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-teal-50 text-teal-700'
                      }`}>
                        Pattern {ch.pattern === 'Back-Office' ? 'B' : 'A'} — {ch.pattern}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-500 shrink-0">{ch.price}</span>
                </div>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">{ch.desc}</p>
                <ul className="space-y-1.5">
                  {ch.includes.map((item) => (
                    <li key={item} className="flex gap-2 text-xs text-gray-600">
                      <Check className="w-3.5 h-3.5 text-teal-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-teal-600 py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { stat: '9', label: 'Admin portals built' },
            { stat: '200+', label: 'API routes deployed' },
            { stat: '42', label: 'Member dashboard modules' },
            { stat: '$3,300', label: 'One-time enrollment fee' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-bold text-white mb-1">{s.stat}</p>
              <p className="text-teal-100 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing overview */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Simple, transparent pricing</h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              One-time enrollment fee covers full setup and onboarding. Monthly SaaS scales with your active members —
              you only pay for members who actually used the platform that month.
            </p>
          </div>

          {/* Enrollment fee */}
          <div className="bg-white rounded-2xl border-2 border-teal-200 p-8 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-teal-600 uppercase tracking-widest mb-1">One-time · paid at signup</p>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Enrollment & Onboarding Fee</h3>
                <p className="text-gray-500 text-sm">Org setup, subdomain provisioning, config wizard, onboarding call, and data migration support.</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-4xl font-bold text-gray-900">$3,300</div>
                <p className="text-gray-400 text-sm">one-time per organization</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-100 grid sm:grid-cols-3 gap-3 text-sm text-gray-600">
              {['White-label setup under your brand', 'Dedicated onboarding specialist (4 sessions)', 'Staff training + admin dashboard access', 'Custom branding — logo, colors, subdomain', 'Member import & bulk enrollment tools', 'Priority support channel'].map(f => (
                <div key={f} className="flex gap-2 items-start">
                  <Check className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-gray-400">Same as Helpful Village's top-tier enrollment fee — justified by AI check-in calls, family dashboard, and fraud detection that HV does not offer.</p>
          </div>

          {/* Monthly SaaS lifecycle tiers */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Monthly SaaS · scales with active members</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 pr-6 text-gray-500 font-medium">Tier</th>
                    <th className="text-left py-2 pr-6 text-gray-500 font-medium">Active members</th>
                    <th className="text-left py-2 pr-6 text-gray-500 font-medium">Monthly rate</th>
                    <th className="text-left py-2 text-gray-400 font-medium text-xs">vs. Helpful Village</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <tr>
                    <td className="py-3.5 pr-6 font-semibold text-gray-900">In-Development</td>
                    <td className="py-3.5 pr-6 text-gray-600">≤ 60 active</td>
                    <td className="py-3.5 pr-6 font-bold text-teal-700">$50 flat</td>
                    <td className="py-3.5 text-gray-400 text-xs">HV charges $100 flat</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-6 font-semibold text-gray-900">Established</td>
                    <td className="py-3.5 pr-6 text-gray-600">61–250 active</td>
                    <td className="py-3.5 pr-6 font-bold text-teal-700">$75 + $1.25/member above 60</td>
                    <td className="py-3.5 text-gray-400 text-xs">HV charges $1.50/member</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-6 font-semibold text-gray-900">Scale</td>
                    <td className="py-3.5 pr-6 text-gray-600">250+ active</td>
                    <td className="py-3.5 pr-6 font-bold text-teal-700">$250 + $1.00/member above 250</td>
                    <td className="py-3.5 text-gray-400 text-xs">HV has no Scale tier</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-4">"Active" = member with a check-in call, community post, service request, or login in the past 30 days. No per-seat fees on volunteers, admins, donors, or inactive members.</p>
          </div>

          {/* AI metered billing */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">AI Metered Usage · billed in arrears on top of monthly base</p>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                { service: 'Aria check-in calls', rate: '$0.08 / call' },
                { service: 'Call transcription', rate: '$0.03 / call' },
                { service: 'Sentiment analysis', rate: '$0.02 / call' },
                { service: 'Quinn care coordination', rate: '$0.05 / session' },
                { service: 'SMS messages', rate: '$0.02 / message' },
                { service: 'Group video calls', rate: 'Included' },
              ].map(({ service, rate }) => (
                <div key={service} className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-700">{service}</span>
                  <span className={`font-semibold ${rate === 'Included' ? 'text-teal-600' : 'text-gray-900'}`}>{rate}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Org sets member pricing */}
          <div className="bg-teal-50 rounded-xl p-5 text-sm text-teal-800 border border-teal-100">
            <strong>Your organization sets its own member-facing pricing.</strong> ThriveAtHome earns the enrollment fee + SaaS fee regardless of what you charge your members. Configure member plan names and prices in your admin dashboard during onboarding.
          </div>
        </div>
      </section>

      {/* Demo Form */}
      <section className="py-20 px-4" id="demo">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Request a demo</h2>
            <p className="text-gray-600">
              We'll show you exactly how ThriveAtHome works for your channel — and walk through what a
              deployment looks like for your organization.
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8">
            {submitted ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Demo request received</h3>
                <p className="text-gray-600 text-sm">
                  Our partnerships team will reach out within one business day to schedule a time that works.
                  Looking forward to it.
                </p>
                <Link href="/" className="inline-block mt-6 text-teal-600 hover:underline text-sm">
                  ← Back to home
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization name</label>
                    <input
                      required
                      value={form.org_name}
                      onChange={(e) => setForm({ ...form, org_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Your organization"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Your name</label>
                    <input
                      required
                      value={form.contact_name}
                      onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="First and last name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Work email</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="you@org.org"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Best number"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization type</label>
                  <div className="relative">
                    <select
                      required
                      value={form.org_type}
                      onChange={(e) => setForm({ ...form, org_type: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Select…</option>
                      {ORG_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Approximate members / employees served <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    value={form.members}
                    onChange={(e) => setForm({ ...form, members: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="e.g. 250 members, 1,200 employees"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    What's your main challenge right now? <span className="text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    placeholder="Volunteer coordination, member engagement, readmission reduction — whatever's top of mind."
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-600 text-white font-bold py-4 rounded-xl hover:bg-teal-700 transition disabled:opacity-60"
                >
                  {loading ? 'Submitting…' : 'Request demo'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* B2C footer strip */}
      <section className="bg-gray-50 border-t border-gray-100 py-10 px-4 text-center">
        <p className="text-gray-500 text-sm mb-4">Looking for personal plans for a senior or family member?</p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 text-teal-600 font-semibold hover:underline"
        >
          See individual pricing
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </main>
  )
}
