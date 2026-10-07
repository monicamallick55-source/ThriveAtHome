'use client'

// M27 Phase 117/118 — manage pet profiles and see upcoming pet milestones.
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import type { Tables } from '@/types/database'
type MemberPetRow = any

const SPECIES: { value: string; label: string; emoji: string }[] = [
  { value: 'dog', label: 'Dog', emoji: '🐕' },
  { value: 'cat', label: 'Cat', emoji: '🐈' },
  { value: 'bird', label: 'Bird', emoji: '🐦' },
  { value: 'rabbit', label: 'Rabbit', emoji: '🐇' },
  { value: 'fish', label: 'Fish', emoji: '🐠' },
  { value: 'horse', label: 'Horse', emoji: '🐎' },
  { value: 'other', label: 'Other', emoji: '🐾' },
]
function speciesEmoji(s: string): string {
  return SPECIES.find((x: any) => x.value === s)?.emoji ?? '🐾'
}

const CELEB_LABELS: Record<string, { emoji: string; label: string }> = {
  pet_birthday: { emoji: '🎂', label: 'Birthday' },
  pet_adoption_anniversary: { emoji: '🏡', label: 'Adoption anniversary' },
  pet_senior_milestone: { emoji: '🌟', label: 'Senior companion' },
}

const card: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid rgba(0,0,0,0.06)',
  padding: '20px',
  boxShadow: 'var(--shadow-card)',
}
const h2: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '22px',
  fontWeight: 500,
  color: 'var(--color-navy)',
  margin: '0 0 12px',
}
const label: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--color-navy)',
  margin: '0 0 4px',
}
const input: React.CSSProperties = {
  width: '100%',
  minHeight: '48px',
  padding: '10px 12px',
  fontFamily: 'var(--font-body)',
  fontSize: '15px',
  border: '1px solid var(--color-warm-grey)',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'white',
}
const btnPrimary: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '15px',
  fontWeight: 600,
  minHeight: '48px',
  padding: '0 22px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  backgroundColor: 'var(--color-teal)',
  color: 'white',
  cursor: 'pointer',
}
const btnGhost: React.CSSProperties = {
  ...btnPrimary,
  backgroundColor: 'transparent',
  color: 'var(--color-navy)',
  border: '1px solid var(--color-warm-grey)',
}

interface UpcomingCeleb {
  id: string
  celebration_type: string
  event_date: string
  ai_message: string | null
  pet_name: string | null
  status: string
}

interface Props {
  memberPreferredName: string
  initialPets: MemberPetRow[]
  upcomingCelebrations: UpcomingCeleb[]
  inCompanionCircle: boolean
}

interface FormState {
  name: string
  species: string
  breed: string
  birth_date: string
  adoption_date: string
  color_markings: string
  notes: string
}
const emptyForm: FormState = {
  name: '',
  species: 'dog',
  breed: '',
  birth_date: '',
  adoption_date: '',
  color_markings: '',
  notes: '',
}

export default function PetsClient({
  memberPreferredName,
  initialPets,
  upcomingCelebrations,
  inCompanionCircle,
}: Props) {
  const router = useRouter()
  const { push } = useToast()
  const [pets, setPets] = useState<MemberPetRow[]>(initialPets)
  const [showForm, setShowForm] = useState(initialPets.length === 0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [busy, setBusy] = useState(false)
  const [memorialFor, setMemorialFor] = useState<MemberPetRow | null>(null)
  const [memorialDate, setMemorialDate] = useState('')
  const [memorialNote, setMemorialNote] = useState('')

  const livingPets = pets.filter((p: any) => p.is_active && !p.passed_away_on)
  const memorializedPets = pets.filter((p: any) => p.passed_away_on)

  function startAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }
  function startEdit(pet: MemberPetRow) {
    setEditingId(pet.id)
    setForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed ?? '',
      birth_date: pet.birth_date ?? '',
      adoption_date: pet.adoption_date ?? '',
      color_markings: pet.color_markings ?? '',
      notes: pet.notes ?? '',
    })
    setShowForm(true)
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      push({ title: 'Please give your companion a name.', severity: 'concern' })
      return
    }
    setBusy(true)
    try {
      const url = editingId ? `/api/pets/${editingId}` : '/api/pets'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Something went wrong.')
      const saved: MemberPetRow = json.pet
      setPets((prev) => (editingId ? prev.map((p: any) => (p.id === saved.id ? saved : p)) : [saved, ...prev]))
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      push({ title: editingId ? 'Pet profile updated.' : `${saved.name} added.`, severity: 'success' })
      router.refresh()
    } catch (err) {
      push({ title: err instanceof Error ? err.message : 'Something went wrong.', severity: 'concern' })
    } finally {
      setBusy(false)
    }
  }

  async function removePet(pet: MemberPetRow) {
    if (!confirm(`Remove ${pet.name}'s profile? This cannot be undone.`)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/pets/${pet.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Could not remove the profile.')
      setPets((prev) => prev.filter((p: any) => p.id !== pet.id))
      push({ title: `${pet.name}'s profile removed.`, severity: 'info' })
      router.refresh()
    } catch (err) {
      push({ title: err instanceof Error ? err.message : 'Something went wrong.', severity: 'concern' })
    } finally {
      setBusy(false)
    }
  }

  async function submitMemorial(e: React.FormEvent) {
    e.preventDefault()
    if (!memorialFor) return
    setBusy(true)
    try {
      const res = await fetch(`/api/pets/${memorialFor.id}/passed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passed_away_on: memorialDate || undefined,
          memorial_note: memorialNote || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Could not save.')
      const saved: MemberPetRow = json.pet
      setPets((prev) => prev.map((p: any) => (p.id === saved.id ? saved : p)))
      setMemorialFor(null)
      setMemorialDate('')
      setMemorialNote('')
      push({
        title: `In memory of ${saved.name}.`,
        body: 'The Companion Circle is here whenever you are ready.',
        severity: 'info',
      })
      router.refresh()
    } catch (err) {
      push({ title: err instanceof Error ? err.message : 'Something went wrong.', severity: 'concern' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Upcoming pet milestones */}
      {upcomingCelebrations.length > 0 && (
        <section style={card}>
          <h2 style={h2}>Upcoming companion milestones</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {upcomingCelebrations.map((c: any) => {
              const info = CELEB_LABELS[c.celebration_type] ?? { emoji: '🐾', label: c.celebration_type }
              return (
                <div
                  key={c.id}
                  style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--color-warm-grey)' }}
                >
                  <span style={{ fontSize: '22px' }} aria-hidden="true">{info.emoji}</span>
                  <div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: 'var(--color-navy)', margin: 0 }}>
                      {c.pet_name ? `${c.pet_name} — ` : ''}{info.label}
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                      {new Date(c.event_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      {c.ai_message ? ` — ${c.ai_message}` : ''}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: '10px 0 0' }}>
            These also appear on{' '}
            <Link href="/dashboard/celebrations" style={{ color: 'var(--color-teal)' }}>
              {memberPreferredName}&apos;s Celebrations page
            </Link>
            , alongside personal milestones.
          </p>
        </section>
      )}

      {/* Living companions */}
      <section style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <h2 style={{ ...h2, margin: 0 }}>Companions</h2>
          {!showForm && (
            <button type="button" style={btnPrimary} onClick={startAdd}>
              + Add a pet
            </button>
          )}
        </div>

        {livingPets.length === 0 && !showForm && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-muted)', margin: '12px 0 0' }}>
            No companions added yet.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: livingPets.length ? '14px' : 0 }}>
          {livingPets.map((pet: any) => (
            <div
              key={pet.id}
              style={{ border: '1px solid var(--color-warm-grey)', borderRadius: 'var(--radius-md)', padding: '14px' }}
            >
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '24px' }} aria-hidden="true">{speciesEmoji(pet.species)}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--color-navy)' }}>
                  {pet.name}
                </span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  {[SPECIES.find((s: any) => s.value === pet.species)?.label, pet.breed].filter(Boolean).join(' · ')}
                </span>
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>
                {pet.birth_date ? `Birthday ${fmt(pet.birth_date)}` : 'No birthday on file'}
                {pet.adoption_date ? ` · Adopted ${fmt(pet.adoption_date)}` : ''}
              </p>
              {pet.notes && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0', fontStyle: 'italic' }}>
                  {pet.notes}
                </p>
              )}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                <button type="button" style={{ ...btnGhost, minHeight: '40px', fontSize: '14px' }} onClick={() => startEdit(pet)}>
                  Edit
                </button>
                <button
                  type="button"
                  style={{ ...btnGhost, minHeight: '40px', fontSize: '14px' }}
                  onClick={() => { setMemorialFor(pet); setMemorialDate(new Date().toISOString().slice(0, 10)) }}
                >
                  Mark as passed away
                </button>
                <button
                  type="button"
                  style={{ ...btnGhost, minHeight: '40px', fontSize: '14px', color: '#b91c1c' }}
                  onClick={() => removePet(pet)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {showForm && (
          <form onSubmit={submitForm} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={label} htmlFor="pet-name">Name</label>
              <input
                id="pet-name"
                style={input}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                maxLength={80}
              />
            </div>
            <div>
              <label style={label} htmlFor="pet-species">Species</label>
              <select
                id="pet-species"
                style={input}
                value={form.species}
                onChange={(e) => setForm({ ...form, species: e.target.value })}
              >
                {SPECIES.map((s: any) => (
                  <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={label} htmlFor="pet-breed">Breed (optional)</label>
              <input id="pet-breed" style={input} value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} maxLength={80} />
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 160px' }}>
                <label style={label} htmlFor="pet-birth">Birthday (estimate is fine)</label>
                <input id="pet-birth" type="date" style={input} value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
              </div>
              <div style={{ flex: '1 1 160px' }}>
                <label style={label} htmlFor="pet-adopt">Adoption day (optional)</label>
                <input id="pet-adopt" type="date" style={input} value={form.adoption_date} onChange={(e) => setForm({ ...form, adoption_date: e.target.value })} />
              </div>
            </div>
            <div>
              <label style={label} htmlFor="pet-color">Colour / markings (optional)</label>
              <input id="pet-color" style={input} value={form.color_markings} onChange={(e) => setForm({ ...form, color_markings: e.target.value })} maxLength={200} />
            </div>
            <div>
              <label style={label} htmlFor="pet-notes">Anything Aria should know (optional)</label>
              <textarea
                id="pet-notes"
                style={{ ...input, minHeight: '72px', resize: 'vertical' }}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                maxLength={2000}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={btnPrimary} disabled={busy}>
                {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add companion'}
              </button>
              <button
                type="button"
                style={btnGhost}
                onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm) }}
                disabled={busy}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Memorial dialog (inline) */}
      {memorialFor && (
        <section style={{ ...card, borderColor: 'var(--color-teal)' }}>
          <h2 style={h2}>In memory of {memorialFor.name}</h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 12px' }}>
            We&apos;ll keep {memorialFor.name}&apos;s profile as a remembrance and pause any upcoming
            reminders. Your care team will be gently notified.
          </p>
          <form onSubmit={submitMemorial} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={label} htmlFor="mem-date">Date they passed</label>
              <input id="mem-date" type="date" style={input} value={memorialDate} onChange={(e) => setMemorialDate(e.target.value)} />
            </div>
            <div>
              <label style={label} htmlFor="mem-note">A few words to remember them by (optional)</label>
              <textarea
                id="mem-note"
                style={{ ...input, minHeight: '72px', resize: 'vertical' }}
                value={memorialNote}
                onChange={(e) => setMemorialNote(e.target.value)}
                maxLength={2000}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={btnPrimary} disabled={busy}>{busy ? 'Saving…' : 'Save remembrance'}</button>
              <button type="button" style={btnGhost} onClick={() => setMemorialFor(null)} disabled={busy}>Cancel</button>
            </div>
          </form>
        </section>
      )}

      {/* Memorialized companions */}
      {memorializedPets.length > 0 && (
        <section style={card}>
          <h2 style={h2}>Remembered</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {memorializedPets.map((pet: any) => (
              <div key={pet.id} style={{ borderLeft: '3px solid var(--color-teal)', paddingLeft: '12px' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--color-navy)', margin: 0 }}>
                  {speciesEmoji(pet.species)} {pet.name}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                  {pet.passed_away_on ? `Passed ${fmt(pet.passed_away_on)}` : 'In memory'}
                  {pet.memorial_note ? ` — ${pet.memorial_note}` : ''}
                </p>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: '14px',
              padding: '14px',
              backgroundColor: 'var(--color-teal-muted)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-primary)', margin: '0 0 8px' }}>
              Losing an animal companion is a real grief. <strong>The Companion Circle</strong> is a
              gentle space for pet loss — separate from our bereavement circles for people.
            </p>
            <Link
              href="/dashboard/pet-loss-support"
              style={{ ...btnPrimary, display: 'inline-block', textDecoration: 'none', lineHeight: '48px' }}
            >
              {inCompanionCircle ? 'Open The Companion Circle' : 'Learn about The Companion Circle'}
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}

function fmt(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
