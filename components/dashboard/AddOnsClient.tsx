'use client'
// M26 — Premium Subscription Add-Ons: browse the catalog, purchase, and manage.
// Monthly add-ons activate immediately (billing is stubbed); one-time services
// create a request the Navigator fulfils. Four add-ons collect a short intake.
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import type { Tables } from '@/types/database'
import type { PlanTier } from '@/lib/entitlements'
type PremiumAddonRow = any
type CaregiverVideoDiaryEntryRow = any
import type { MemberAddonWithCatalog } from '@/lib/data/premium-addons'

interface Props {
  catalog: PremiumAddonRow[]
  memberAddons: MemberAddonWithCatalog[]
  memberAge: number | null
  planTier: string
  hasLongDistance: boolean
  initialVideoDiary: CaregiverVideoDiaryEntryRow[]
}

const PLAN_RANK: Record<PlanTier, number> = { free: 0, standard: 1, premier: 2, enterprise: 3 }
const INTAKE_KEYS = new Set([
  'annual_care_planning',
  'benefits_maximizer_deep_dive',
  'milestone_birthday_memory_book',
  'extra_legal_consultation',
])
const CARE_PLAN_FOCUS = [
  'Health & medications',
  'Home safety',
  'Money & benefits',
  'Legal & documents',
  'Social connection',
  'Future care options',
]

const card: React.CSSProperties = {
  backgroundColor: 'white',
  border: '1px solid var(--color-warm-grey)',
  borderRadius: 'var(--radius-lg)',
  padding: '20px',
  boxShadow: 'var(--shadow-card)',
}
const label: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: '15px',
  fontWeight: 600,
  color: 'var(--color-navy)',
  marginBottom: '6px',
}
const field: React.CSSProperties = {
  width: '100%',
  minHeight: '52px',
  border: '1.5px solid var(--color-warm-grey)',
  borderRadius: 'var(--radius-md)',
  padding: '12px 14px',
  fontSize: '16px',
  fontFamily: 'var(--font-body)',
  backgroundColor: 'white',
  boxSizing: 'border-box',
}

function priceLabel(a: PremiumAddonRow): string {
  const dollars = (a.price_cents / 100).toFixed(a.price_cents % 100 === 0 ? 0 : 2)
  return a.billing === 'monthly' ? `$${dollars}/month` : `$${dollars} one-time`
}

function statusLabel(status: string): string {
  if (status === 'active') return 'Active'
  if (status === 'pending') return 'Requested — your Navigator is arranging it'
  if (status === 'fulfilled') return 'Completed'
  if (status === 'cancelled') return 'Cancelled'
  if (status === 'expired') return 'Expired'
  return status
}

/** Which milestone birthdays the member is within ~13 months of. */
function eligibleMilestones(age: number | null): number[] {
  if (age == null) return [70, 75, 80]
  return [70, 75, 80].filter((m: any) => age >= m - 2 && age <= m + 1)
}

export default function AddOnsClient({
  catalog,
  memberAddons,
  memberAge,
  planTier,
  hasLongDistance,
  initialVideoDiary,
}: Props) {
  const router = useRouter()
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [intakeKey, setIntakeKey] = useState<string | null>(null)

  // intake fields
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [preferredTimes, setPreferredTimes] = useState('')
  const [household, setHousehold] = useState({ incomeBand: '', householdSize: '', veteran: false, homeowner: false })
  const [milestoneAge, setMilestoneAge] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [dedicationText, setDedicationText] = useState('')
  const [legalTopic, setLegalTopic] = useState('')

  // video diary
  const [diary, setDiary] = useState<CaregiverVideoDiaryEntryRow[]>(initialVideoDiary)
  const [diaryTitle, setDiaryTitle] = useState('')
  const [diaryNote, setDiaryNote] = useState('')
  const [diaryBusy, setDiaryBusy] = useState(false)

  const activeByKey = useMemo(() => {
    const m = new Map<string, MemberAddonWithCatalog>()
    for (const r of memberAddons) {
      if (r.status === 'active' || r.status === 'pending') {
        if (!m.has(r.addon_key)) m.set(r.addon_key, r)
      }
    }
    return m
  }, [memberAddons])

  const milestones = eligibleMilestones(memberAge)
  const monthly = catalog.filter((a: any) => a.billing === 'monthly')
  const oneTime = catalog.filter((a: any) => a.billing === 'one_time')

  function planAllows(a: PremiumAddonRow): boolean {
    if (!a.min_plan_tier) return true
    return (PLAN_RANK[planTier as PlanTier] ?? 0) >= (PLAN_RANK[a.min_plan_tier as PlanTier] ?? 0)
  }

  function resetIntake() {
    setFocusAreas([])
    setPreferredTimes('')
    setHousehold({ incomeBand: '', householdSize: '', veteran: false, homeowner: false })
    setMilestoneAge('')
    setRecipientName('')
    setRecipientAddress('')
    setDedicationText('')
    setLegalTopic('')
  }

  async function purchase(addonKey: string, intake?: Record<string, unknown>) {
    setBusyKey(addonKey)
    setMsg(null)
    try {
      const res = await fetch('/api/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addon_key: addonKey, intake: intake ?? {} }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMsg({ kind: 'err', text: json.error ?? 'Something went wrong. Please try again.' })
        return
      }
      setMsg({ kind: 'ok', text: 'Done. You can see it below under "Your add-ons".' })
      setIntakeKey(null)
      resetIntake()
      router.refresh()
    } catch {
      setMsg({ kind: 'err', text: 'Network error. Please try again.' })
    } finally {
      setBusyKey(null)
    }
  }

  async function cancel(memberAddonId: string, addonKey: string) {
    setBusyKey(addonKey)
    setMsg(null)
    try {
      const res = await fetch(`/api/addons/${memberAddonId}`, { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMsg({ kind: 'err', text: json.error ?? 'Could not cancel. Please try again.' })
        return
      }
      setMsg({ kind: 'ok', text: 'Cancelled.' })
      router.refresh()
    } catch {
      setMsg({ kind: 'err', text: 'Network error. Please try again.' })
    } finally {
      setBusyKey(null)
    }
  }

  function submitIntake(addonKey: string) {
    if (addonKey === 'annual_care_planning') {
      void purchase(addonKey, { focusAreas, preferredTimes })
    } else if (addonKey === 'benefits_maximizer_deep_dive') {
      void purchase(addonKey, { household })
    } else if (addonKey === 'milestone_birthday_memory_book') {
      if (!milestoneAge) {
        setMsg({ kind: 'err', text: 'Choose which milestone birthday this is for.' })
        return
      }
      void purchase(addonKey, {
        milestoneAge: Number(milestoneAge),
        recipientName,
        recipientAddress,
        dedicationText,
      })
    } else if (addonKey === 'extra_legal_consultation') {
      void purchase(addonKey, { topic: legalTopic })
    }
  }

  async function addDiaryEntry(e: React.FormEvent) {
    e.preventDefault()
    if (diaryTitle.trim().length < 2) {
      setMsg({ kind: 'err', text: 'Give the diary entry a short title.' })
      return
    }
    setDiaryBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/addons/video-diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: diaryTitle, note: diaryNote }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMsg({ kind: 'err', text: json.error ?? 'Could not save the entry.' })
        return
      }
      setDiary((d) => [json.entry as CaregiverVideoDiaryEntryRow, ...d])
      setDiaryTitle('')
      setDiaryNote('')
      setMsg({ kind: 'ok', text: 'Saved to the family video diary.' })
    } catch {
      setMsg({ kind: 'err', text: 'Network error. Please try again.' })
    } finally {
      setDiaryBusy(false)
    }
  }

  function renderIntakeForm(a: PremiumAddonRow) {
    return (
      <div style={{ marginTop: '14px', borderTop: '1px solid var(--color-warm-grey)', paddingTop: '14px' }}>
        {a.addon_key === 'annual_care_planning' && (
          <>
            <span style={label}>What should the session focus on? (choose any)</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {CARE_PLAN_FOCUS.map((f: any) => {
                const on = focusAreas.includes(f)
                return (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setFocusAreas((prev) => (on ? prev.filter((x: any) => x !== f) : [...prev, f]))}
                    style={{
                      border: `1.5px solid ${on ? 'var(--color-navy)' : 'var(--color-warm-grey)'}`,
                      backgroundColor: on ? 'var(--color-navy)' : 'white',
                      color: on ? 'white' : 'var(--color-navy)',
                      borderRadius: '999px',
                      padding: '8px 14px',
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {f}
                  </button>
                )
              })}
            </div>
            <label style={label} htmlFor="cp-times">Times that usually work for a call</label>
            <input
              id="cp-times"
              style={field}
              value={preferredTimes}
              onChange={(e) => setPreferredTimes(e.target.value)}
              placeholder="e.g. weekday mornings, or after 3pm"
            />
          </>
        )}

        {a.addon_key === 'benefits_maximizer_deep_dive' && (
          <>
            <label style={label} htmlFor="bd-income">Household income band</label>
            <select
              id="bd-income"
              style={field}
              value={household.incomeBand}
              onChange={(e) => setHousehold((h) => ({ ...h, incomeBand: e.target.value }))}
            >
              <option value="">Prefer not to say</option>
              <option value="under_15k">Under $15,000</option>
              <option value="15k_25k">$15,000–$25,000</option>
              <option value="25k_40k">$25,000–$40,000</option>
              <option value="40k_60k">$40,000–$60,000</option>
              <option value="over_60k">Over $60,000</option>
            </select>
            <label style={{ ...label, marginTop: '12px' }} htmlFor="bd-size">People in the household</label>
            <input
              id="bd-size"
              style={field}
              inputMode="numeric"
              value={household.householdSize}
              onChange={(e) => setHousehold((h) => ({ ...h, householdSize: e.target.value }))}
              placeholder="e.g. 1"
            />
            <div style={{ display: 'flex', gap: '18px', marginTop: '12px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-body)', fontSize: '15px' }}>
                <input
                  type="checkbox"
                  checked={household.veteran}
                  onChange={(e) => setHousehold((h) => ({ ...h, veteran: e.target.checked }))}
                />
                Veteran or surviving spouse
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-body)', fontSize: '15px' }}>
                <input
                  type="checkbox"
                  checked={household.homeowner}
                  onChange={(e) => setHousehold((h) => ({ ...h, homeowner: e.target.checked }))}
                />
                Owns their home
              </label>
            </div>
          </>
        )}

        {a.addon_key === 'milestone_birthday_memory_book' && (
          <>
            <label style={label} htmlFor="mb-age">Which milestone birthday?</label>
            <select id="mb-age" style={field} value={milestoneAge} onChange={(e) => setMilestoneAge(e.target.value)}>
              <option value="">Choose…</option>
              {[70, 75, 80].map((m: any) => (
                <option key={m} value={m} disabled={milestones.length > 0 && !milestones.includes(m)}>
                  {m}th birthday{milestones.length > 0 && !milestones.includes(m) ? ' (not near this date)' : ''}
                </option>
              ))}
            </select>
            <label style={{ ...label, marginTop: '12px' }} htmlFor="mb-name">Send the book to</label>
            <input id="mb-name" style={field} value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Recipient name" />
            <label style={{ ...label, marginTop: '12px' }} htmlFor="mb-addr">Shipping address</label>
            <textarea
              id="mb-addr"
              style={{ ...field, minHeight: '72px' }}
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="Street, city, state, ZIP"
            />
            <label style={{ ...label, marginTop: '12px' }} htmlFor="mb-ded">Dedication (optional)</label>
            <textarea
              id="mb-ded"
              style={{ ...field, minHeight: '72px' }}
              value={dedicationText}
              onChange={(e) => setDedicationText(e.target.value)}
              placeholder="A short message for the first page"
            />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
              After you order, your Navigator will send a link to upload photos and notes.
            </p>
          </>
        )}

        {a.addon_key === 'extra_legal_consultation' && (
          <>
            <label style={label} htmlFor="lc-topic">What is the consultation about?</label>
            <textarea
              id="lc-topic"
              style={{ ...field, minHeight: '72px' }}
              value={legalTopic}
              onChange={(e) => setLegalTopic(e.target.value)}
              placeholder="e.g. updating a will, power of attorney, a specific question"
            />
          </>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
          <Button onClick={() => submitIntake(a.addon_key)} disabled={busyKey === a.addon_key}>
            {busyKey === a.addon_key ? 'Working…' : `Confirm — ${priceLabel(a)}`}
          </Button>
          <Button variant="secondary" onClick={() => { setIntakeKey(null); resetIntake() }}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  function renderCard(a: PremiumAddonRow) {
    const owned = activeByKey.get(a.addon_key)
    const allowed = planAllows(a)
    const isOpen = intakeKey === a.addon_key
    return (
      <div key={a.addon_key} style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '21px', fontWeight: 600, color: 'var(--color-navy)', margin: 0 }}>
            {a.name}
          </h3>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 700, color: 'var(--color-navy)' }}>
            {priceLabel(a)}
          </span>
        </div>
        {a.tagline && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '4px 0 0', fontStyle: 'italic' }}>
            {a.tagline}
          </p>
        )}
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-primary)', margin: '10px 0 0' }}>
          {a.description}
        </p>
        {a.benefits.length > 0 && (
          <ul style={{ margin: '10px 0 0', paddingLeft: '18px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            {a.benefits.map((b: string) => (
              <li key={b} style={{ marginBottom: '3px' }}>{b}</li>
            ))}
          </ul>
        )}

        <div style={{ marginTop: '14px' }}>
          {owned ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700,
                  color: owned.status === 'active' ? 'var(--color-success, #1a7f5a)' : 'var(--color-navy)',
                  backgroundColor: 'var(--color-warm-white)', border: '1px solid var(--color-warm-grey)',
                  borderRadius: '999px', padding: '4px 12px',
                }}
              >
                {statusLabel(owned.status)}
              </span>
              {(owned.billing === 'monthly' || owned.status === 'pending') && (
                <button
                  type="button"
                  onClick={() => cancel(owned.id, a.addon_key)}
                  disabled={busyKey === a.addon_key}
                  style={{
                    background: 'none', border: 'none', textDecoration: 'underline',
                    color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)',
                    fontSize: '14px', cursor: 'pointer',
                  }}
                >
                  {busyKey === a.addon_key ? 'Working…' : owned.billing === 'monthly' ? 'Cancel add-on' : 'Cancel request'}
                </button>
              )}
            </div>
          ) : !allowed ? (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
              Available on the {a.min_plan_tier} plan and above.
            </p>
          ) : isOpen ? (
            renderIntakeForm(a)
          ) : (
            <Button
              onClick={() => (INTAKE_KEYS.has(a.addon_key) ? setIntakeKey(a.addon_key) : purchase(a.addon_key))}
              disabled={busyKey === a.addon_key}
            >
              {busyKey === a.addon_key
                ? 'Working…'
                : a.billing === 'monthly'
                  ? 'Add to plan'
                  : INTAKE_KEYS.has(a.addon_key)
                    ? 'Get started'
                    : `Purchase — ${priceLabel(a)}`}
            </Button>
          )}
        </div>
      </div>
    )
  }

  const sectionHeading: React.CSSProperties = {
    fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 600,
    color: 'var(--color-navy)', margin: '28px 0 12px',
  }

  return (
    <div>
      {msg && (
        <div
          role="alert"
          style={{
            ...card,
            borderColor: msg.kind === 'ok' ? 'var(--color-success, #1a7f5a)' : 'var(--color-danger, #b4231f)',
            marginBottom: '16px',
            fontFamily: 'var(--font-body)',
            fontSize: '15px',
          }}
        >
          {msg.text}
        </div>
      )}

      {memberAddons.some((r: any) => r.status === 'active' || r.status === 'pending') && (
        <>
          <h2 style={{ ...sectionHeading, marginTop: 0 }}>Your add-ons</h2>
          <div style={{ ...card, padding: 0 }}>
            {memberAddons
              .filter((r: any) => r.status === 'active' || r.status === 'pending')
              .map((r: any, i: number) => (
                <div
                  key={r.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '14px 18px',
                    borderTop: i === 0 ? 'none' : '1px solid var(--color-warm-grey)', flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <strong style={{ fontFamily: 'var(--font-body)', color: 'var(--color-navy)' }}>{r.addon_name}</strong>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                      {statusLabel(r.status)}
                      {r.billing === 'monthly' && r.renews_at
                        ? ` · renews ${new Date(r.renews_at).toLocaleDateString()}`
                        : ''}
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 700, color: 'var(--color-navy)' }}>
                    ${(r.price_cents / 100).toFixed(2)}
                    {r.billing === 'monthly' ? '/mo' : ''}
                  </span>
                </div>
              ))}
          </div>
        </>
      )}

      {hasLongDistance && (
        <>
          <h2 style={sectionHeading}>Family video diary</h2>
          <div style={card}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: 0 }}>
              Leave a short note or video message. Your Navigator can play it back during a visit.
            </p>
            <form onSubmit={addDiaryEntry}>
              <label style={label} htmlFor="vd-title">Title</label>
              <input id="vd-title" style={field} value={diaryTitle} onChange={(e) => setDiaryTitle(e.target.value)} placeholder="e.g. Hello from Denver" />
              <label style={{ ...label, marginTop: '12px' }} htmlFor="vd-note">Note (optional)</label>
              <textarea id="vd-note" style={{ ...field, minHeight: '72px' }} value={diaryNote} onChange={(e) => setDiaryNote(e.target.value)} />
              <div style={{ marginTop: '12px' }}>
                <Button type="submit" disabled={diaryBusy}>{diaryBusy ? 'Saving…' : 'Save entry'}</Button>
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                After saving, attach a video from the entry list (mp4, mov, or webm, up to 100&nbsp;MB).
              </p>
            </form>
            {diary.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0' }}>
                {diary.map((d: any) => (
                  <li
                    key={d.id}
                    style={{ borderTop: '1px solid var(--color-warm-grey)', padding: '10px 0', fontFamily: 'var(--font-body)', fontSize: '14px' }}
                  >
                    <strong style={{ color: 'var(--color-navy)' }}>{d.title}</strong>
                    {d.video_path ? ' · 🎥 video attached' : ''}
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                      {new Date(d.created_at).toLocaleDateString()}
                    </div>
                    {d.note && <p style={{ margin: '4px 0 0', color: 'var(--color-text-primary)' }}>{d.note}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <h2 style={sectionHeading}>Monthly add-ons</h2>
      <div style={{ display: 'grid', gap: '16px' }}>{monthly.map(renderCard)}</div>

      <h2 style={sectionHeading}>One-time services</h2>
      <div style={{ display: 'grid', gap: '16px' }}>{oneTime.map(renderCard)}</div>
    </div>
  )
}
