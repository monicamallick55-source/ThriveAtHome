'use client'
// app/for-organizations/signup/page.tsx
// B2B self-serve enrollment wizard — 6 steps + $3,300 Stripe enrollment fee + org_id creation
import { useState } from 'react'
import Link from 'next/link'
import { Check, ChevronRight, Loader2, Building2, Users, CreditCard, CheckCircle } from 'lucide-react'

type OrgType = 'senior_living' | 'aaa_chapter' | 'church_faith' | 'employer' | 'health_plan' | 'other'

const ORG_TYPE_LABELS: Record<OrgType, string> = {
  senior_living: 'Senior Living Community',
  aaa_chapter:   'Area Agency on Aging (AAA)',
  church_faith:  'Church / Faith Community',
  employer:      'Employer / HR Benefits',
  health_plan:   'Health Plan / Medicare Advantage',
  other:         'Other Organization',
}

const STEPS = [
  'Organization',
  'Contact',
  'Members',
  'Plan',
  'Review',
  'Payment',
]

function StepIndicator({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '36px', overflowX: 'auto', paddingBottom: '4px' }}>
      {STEPS.map((label, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '56px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
              background: i < step ? '#2d6a4f' : i === step ? '#52b788' : '#e8f5e9',
              color: i <= step ? '#fff' : '#aaa',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 700, transition: 'all 0.2s',
            }}>
              {i < step ? <Check size={14} /> : i + 1}
            </div>
            <span style={{ fontSize: '10px', color: i <= step ? '#2d6a4f' : '#aaa', marginTop: '4px', whiteSpace: 'nowrap', fontWeight: i === step ? 700 : 400 }}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ width: '24px', height: '2px', background: i < step ? '#2d6a4f' : '#e0e0e0', flexShrink: 0, marginBottom: '18px', transition: 'background 0.3s' }} />
          )}
        </div>
      ))}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  border: '1.5px solid #d0d0d0', fontSize: '16px', boxSizing: 'border-box',
  fontFamily: 'inherit', outline: 'none',
}
const labelStyle: React.CSSProperties = {
  fontSize: '14px', fontWeight: 600, color: '#333', marginBottom: '6px', display: 'block',
}
const selectStyle: React.CSSProperties = { ...inputStyle, background: '#fff' }

export default function B2BSignupPage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null)

  const [org, setOrg] = useState({
    name: '',
    type: '' as OrgType | '',
    website: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    ein: '',
  })

  const [contact, setContact] = useState({
    firstName: '',
    lastName: '',
    title: '',
    email: '',
    phone: '',
    password: '',
  })

  const [members, setMembers] = useState({
    estimatedCount: '',
    deploymentTimeline: '',
    primaryUseCase: '',
    additionalNotes: '',
  })

  const [selectedPlan] = useState('b2b_standard')  // B2B standard; Premier B2B is by application

  const orgField = (key: keyof typeof org) => ({
    value: org[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setOrg(o => ({ ...o, [key]: e.target.value })),
  })
  const contactField = (key: keyof typeof contact) => ({
    value: contact[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setContact(c => ({ ...c, [key]: e.target.value })),
  })
  const membersField = (key: keyof typeof members) => ({
    value: members[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setMembers(m => ({ ...m, [key]: e.target.value })),
  })

  async function handleOrgSubmit() {
    if (!org.name || !org.type || !org.city || !org.state) {
      setError('Please fill in organization name, type, city, and state.')
      return
    }
    setError('')
    setStep(1)
  }

  async function handleContactSubmit() {
    if (!contact.firstName || !contact.lastName || !contact.email || !contact.password) {
      setError('Please fill in all required contact fields.')
      return
    }
    if (contact.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setError('')
    setStep(2)
  }

  async function handleMembersSubmit() {
    if (!members.estimatedCount) { setError('Please estimate your member count.'); return }
    setError('')
    setStep(3)
  }

  async function handlePlanSubmit() {
    setError('')
    setStep(4)
  }

  async function handleCreateOrg() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/b2b-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org, contact, members, plan: selectedPlan }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create organization.'); return }
      setCreatedOrgId(data.org_id)
      setStep(5)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePayment() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'b2b_enrollment',
          billing: 'one_time',
          email: contact.email,
          org_id: createdOrgId,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) { setError(data.error || 'Failed to start payment.'); return }
      window.location.href = data.url
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const card: React.CSSProperties = {
    background: '#fff', borderRadius: '16px', padding: '32px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7faf7', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px' }}>
      <Link href="/" style={{ textDecoration: 'none', marginBottom: '32px' }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#2d6a4f' }}>
          Thrive<span style={{ color: '#52b788' }}>@Home</span>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#888', marginLeft: '8px' }}>for Organizations</span>
        </div>
      </Link>

      <div style={{ width: '100%', maxWidth: '580px' }}>
        <StepIndicator step={step} />

        <div style={card}>
          {/* ── STEP 0: Organization Info ─────────────────────────── */}
          {step === 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <Building2 size={28} color="#2d6a4f" />
                <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>Your organization</h1>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Organization name *</label>
                <input style={inputStyle} placeholder="Sunridge Senior Living" {...orgField('name')} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Organization type *</label>
                <select style={selectStyle} value={org.type} onChange={e => setOrg(o => ({ ...o, type: e.target.value as OrgType }))}>
                  <option value="">Select type…</option>
                  {Object.entries(ORG_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Website</label>
                <input style={inputStyle} placeholder="https://sunridgesenior.com" type="url" {...orgField('website')} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Street address</label>
                <input style={inputStyle} placeholder="123 Main St" {...orgField('address')} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>City *</label>
                  <input style={inputStyle} placeholder="Pasadena" {...orgField('city')} />
                </div>
                <div>
                  <label style={labelStyle}>State *</label>
                  <input style={inputStyle} placeholder="CA" maxLength={2} {...orgField('state')} />
                </div>
                <div>
                  <label style={labelStyle}>ZIP</label>
                  <input style={inputStyle} placeholder="91101" maxLength={5} {...orgField('zip')} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>EIN (optional — for nonprofit verification)</label>
                <input style={inputStyle} placeholder="12-3456789" {...orgField('ein')} />
              </div>

              {error && <div style={{ padding: '12px', background: '#fff0f0', borderRadius: '8px', color: '#c0392b', fontSize: '14px', marginBottom: '16px' }}>{error}</div>}

              <button onClick={handleOrgSubmit} style={{ width: '100%', padding: '14px', borderRadius: '10px', background: '#2d6a4f', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                Continue <ChevronRight size={18} />
              </button>
            </>
          )}

          {/* ── STEP 1: Contact Info ──────────────────────────────── */}
          {step === 1 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <Users size={28} color="#2d6a4f" />
                <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>Primary contact</h1>
              </div>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>This will be your admin account for <strong>{org.name}</strong>.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>First name *</label>
                  <input style={inputStyle} placeholder="Sarah" {...contactField('firstName')} />
                </div>
                <div>
                  <label style={labelStyle}>Last name *</label>
                  <input style={inputStyle} placeholder="Chen" {...contactField('lastName')} />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Job title</label>
                <input style={inputStyle} placeholder="Activities Director" {...contactField('title')} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Work email *</label>
                <input type="email" style={inputStyle} placeholder="sarah@sunridgesenior.com" {...contactField('email')} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Phone</label>
                <input type="tel" style={inputStyle} placeholder="(555) 234-5678" {...contactField('phone')} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Password * (8+ characters)</label>
                <input type="password" style={inputStyle} placeholder="Choose a secure password" {...contactField('password')} />
              </div>

              {error && <div style={{ padding: '12px', background: '#fff0f0', borderRadius: '8px', color: '#c0392b', fontSize: '14px', marginBottom: '16px' }}>{error}</div>}

              <button onClick={handleContactSubmit} style={{ width: '100%', padding: '14px', borderRadius: '10px', background: '#2d6a4f', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                Continue <ChevronRight size={18} />
              </button>
              <button onClick={() => { setError(''); setStep(0) }} style={{ width: '100%', marginTop: '10px', padding: '10px', borderRadius: '8px', border: '1.5px solid #d0d0d0', background: '#fff', color: '#555', cursor: 'pointer', fontSize: '14px' }}>
                ← Back
              </button>
            </>
          )}

          {/* ── STEP 2: Member Details ──────────────────────────────── */}
          {step === 2 && (
            <>
              <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '20px' }}>About your members</h1>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Estimated number of members *</label>
                <select style={selectStyle} {...membersField('estimatedCount')}>
                  <option value="">Select range…</option>
                  <option value="1-25">1–25 members</option>
                  <option value="26-100">26–100 members</option>
                  <option value="101-500">101–500 members</option>
                  <option value="501-1000">501–1,000 members</option>
                  <option value="1000+">Over 1,000 members</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>When do you plan to deploy?</label>
                <select style={selectStyle} {...membersField('deploymentTimeline')}>
                  <option value="">Select timeline…</option>
                  <option value="immediate">Immediately (within 2 weeks)</option>
                  <option value="1_month">Within 1 month</option>
                  <option value="1_3_months">1–3 months</option>
                  <option value="3_6_months">3–6 months</option>
                  <option value="planning">Just planning for now</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Primary use case</label>
                <select style={selectStyle} {...membersField('primaryUseCase')}>
                  <option value="">Select primary use case…</option>
                  <option value="resident_engagement">Resident engagement & social connection</option>
                  <option value="safety_monitoring">Safety monitoring & emergency alerts</option>
                  <option value="family_communication">Family communication portal</option>
                  <option value="care_coordination">Care coordination & services</option>
                  <option value="all_above">All of the above</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Anything else we should know?</label>
                <textarea
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                  placeholder="Special populations, accessibility needs, existing tech stack…"
                  value={members.additionalNotes}
                  onChange={e => setMembers(m => ({ ...m, additionalNotes: e.target.value }))}
                />
              </div>

              {error && <div style={{ padding: '12px', background: '#fff0f0', borderRadius: '8px', color: '#c0392b', fontSize: '14px', marginBottom: '16px' }}>{error}</div>}

              <button onClick={handleMembersSubmit} style={{ width: '100%', padding: '14px', borderRadius: '10px', background: '#2d6a4f', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                Continue <ChevronRight size={18} />
              </button>
              <button onClick={() => { setError(''); setStep(1) }} style={{ width: '100%', marginTop: '10px', padding: '10px', borderRadius: '8px', border: '1.5px solid #d0d0d0', background: '#fff', color: '#555', cursor: 'pointer', fontSize: '14px' }}>
                ← Back
              </button>
            </>
          )}

          {/* ── STEP 3: Plan Selection ──────────────────────────────── */}
          {step === 3 && (
            <>
              <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>B2B Platform plan</h1>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>One-time enrollment fee includes full platform setup, training, and dedicated onboarding support.</p>

              <div style={{ border: '2px solid #52b788', borderRadius: '14px', padding: '24px', background: '#f0faf4', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '18px', color: '#1a1a1a' }}>ThriveAtHome B2B Standard</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#2d6a4f', margin: '4px 0' }}>$3,300</div>
                    <div style={{ fontSize: '13px', color: '#666' }}>one-time enrollment + per-member monthly pricing</div>
                  </div>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#52b788', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={14} color="#fff" strokeWidth={3} />
                  </div>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {[
                    'Full platform white-label setup for your organization',
                    'Dedicated onboarding specialist (4 sessions)',
                    'Staff training + admin dashboard access',
                    'Custom branding (logo, colors)',
                    'Member import & bulk enrollment tools',
                    'Reporting dashboard — utilization & engagement',
                    'Priority support channel',
                  ].map(f => (
                    <li key={f} style={{ display: 'flex', gap: '8px', marginBottom: '6px', fontSize: '13px', color: '#444', alignItems: 'flex-start' }}>
                      <Check size={12} color="#52b788" strokeWidth={3} style={{ flexShrink: 0, marginTop: '2px' }} /> {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ background: '#fff', borderRadius: '10px', padding: '14px 16px', border: '1px solid #e0e0e0', fontSize: '13px', color: '#666', marginBottom: '20px' }}>
                <strong style={{ color: '#1a1a1a' }}>Monthly SaaS</strong> (billed after 30-day free trial, based on active members):<br /><br />
                <span style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                  <span>≤ 60 active members</span><strong style={{ color: '#2d6a4f' }}>$50 flat/mo</strong>
                  <span>61–250 active members</span><strong style={{ color: '#2d6a4f' }}>$75 + $1.25/member</strong>
                  <span>250+ active members</span><strong style={{ color: '#2d6a4f' }}>$250 + $1.00/member</strong>
                </span>
                <br />AI metered usage billed in arrears (Aria calls $0.08, SMS $0.02, transcription $0.03).<br />
                <strong>You set your own member-facing pricing</strong> — TAH earns the SaaS fee regardless.
              </div>

              <button onClick={handlePlanSubmit} style={{ width: '100%', padding: '14px', borderRadius: '10px', background: '#2d6a4f', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                Continue to Review <ChevronRight size={18} />
              </button>
              <button onClick={() => setStep(2)} style={{ width: '100%', marginTop: '10px', padding: '10px', borderRadius: '8px', border: '1.5px solid #d0d0d0', background: '#fff', color: '#555', cursor: 'pointer', fontSize: '14px' }}>
                ← Back
              </button>
            </>
          )}

          {/* ── STEP 4: Review ──────────────────────────────────────── */}
          {step === 4 && (
            <>
              <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '20px' }}>Review & confirm</h1>

              {[
                { title: 'Organization', items: [
                  ['Name', org.name],
                  ['Type', ORG_TYPE_LABELS[org.type as OrgType] || org.type],
                  ['Location', `${org.city}, ${org.state} ${org.zip}`],
                ]},
                { title: 'Admin contact', items: [
                  ['Name', `${contact.firstName} ${contact.lastName}`],
                  ['Title', contact.title || '—'],
                  ['Email', contact.email],
                  ['Phone', contact.phone || '—'],
                ]},
                { title: 'Members', items: [
                  ['Estimated count', members.estimatedCount],
                  ['Timeline', members.deploymentTimeline || '—'],
                  ['Primary use case', members.primaryUseCase || '—'],
                ]},
                { title: 'Plan', items: [
                  ['Package', 'ThriveAtHome B2B Standard'],
                  ['Enrollment fee', '$3,300 (one-time)'],
                ]},
              ].map(section => (
                <div key={section.title} style={{ marginBottom: '16px', background: '#f7faf7', borderRadius: '10px', padding: '16px', border: '1px solid #e0ede8' }}>
                  <div style={{ fontWeight: 700, color: '#2d6a4f', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>{section.title}</div>
                  {section.items.map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '14px' }}>
                      <span style={{ color: '#888' }}>{k}</span>
                      <span style={{ color: '#1a1a1a', fontWeight: 500 }}>{v}</span>
                    </div>
                  ))}
                </div>
              ))}

              {error && <div style={{ padding: '12px', background: '#fff0f0', borderRadius: '8px', color: '#c0392b', fontSize: '14px', marginBottom: '16px' }}>{error}</div>}

              <button onClick={handleCreateOrg} disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: '10px', background: loading ? '#ccc' : '#2d6a4f', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Creating organization…</> : <>Create organization & pay <ChevronRight size={18} /></>}
              </button>
              <button onClick={() => setStep(3)} style={{ width: '100%', marginTop: '10px', padding: '10px', borderRadius: '8px', border: '1.5px solid #d0d0d0', background: '#fff', color: '#555', cursor: 'pointer', fontSize: '14px' }}>
                ← Back
              </button>
            </>
          )}

          {/* ── STEP 5: Payment ─────────────────────────────────────── */}
          {step === 5 && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <CheckCircle size={48} color="#52b788" style={{ marginBottom: '12px' }} />
                <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Organization created!</h1>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  <strong>{org.name}</strong> is set up. Complete payment to activate your platform.
                </p>
                {createdOrgId && (
                  <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>
                    Org ID: <code>{createdOrgId}</code>
                  </div>
                )}
              </div>

              <div style={{ background: '#f7faf7', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #d4edda' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700 }}>B2B Standard Enrollment</span>
                  <span style={{ fontWeight: 800, color: '#2d6a4f', fontSize: '20px' }}>$3,300</span>
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>One-time setup + onboarding · Per-member billing starts after members are enrolled</div>
              </div>

              {error && <div style={{ padding: '12px', background: '#fff0f0', borderRadius: '8px', color: '#c0392b', fontSize: '14px', marginBottom: '16px' }}>{error}</div>}

              <button onClick={handlePayment} disabled={loading} style={{ width: '100%', padding: '16px', borderRadius: '10px', background: loading ? '#ccc' : '#2d6a4f', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Connecting…</> : <><CreditCard size={18} /> Pay $3,300 securely with Stripe</>}
              </button>

              <p style={{ fontSize: '12px', color: '#aaa', textAlign: 'center', marginTop: '16px' }}>
                🔒 Secured by Stripe · Questions? Email partnerships@thriveathome.com
              </p>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#aaa' }}>
          Prefer a custom demo first?{' '}
          <Link href="/for-organizations" style={{ color: '#2d6a4f', fontWeight: 600 }}>Talk to our team →</Link>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
