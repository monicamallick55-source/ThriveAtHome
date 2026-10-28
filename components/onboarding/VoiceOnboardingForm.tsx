// components/onboarding/VoiceOnboardingForm.tsx
// Shows form fields filling in real time as Quinn captures them via voice
// Handles: SSE connection, auto-submit on ready_to_submit, error recovery UI

'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ───────────────────────────────────────────────────────────────────

interface OnboardingFields {
  first_name?: string
  last_name?: string
  preferred_name?: string
  phone?: string
  email?: string
  dob?: string
  address?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  name_spelling_confirmed?: boolean
  status?: string
  error_type?: string
}

type RecoveryOption = 'fill_manually' | 'try_again' | 'call_in'

interface VoiceOnboardingFormProps {
  sessionId: string
  initialFields?: OnboardingFields
}

// ─── Manual fallback form ────────────────────────────────────────────────────

function ManualFallbackForm({
  initialData,
  sessionId,
  onSuccess,
}: {
  initialData: OnboardingFields
  sessionId: string
  onSuccess: () => void
}) {
  const [fields, setFields] = useState<OnboardingFields>(initialData)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(field: keyof OnboardingFields, value: string) {
    setFields((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Patch the session with manually-entered data, then submit
      await fetch('/api/onboarding/patch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, fields }),
      })

      const res = await fetch('/api/onboarding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Submission failed')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={fields.first_name ?? ''}
            onChange={(e) => set('first_name', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-base"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={fields.last_name ?? ''}
            onChange={(e) => set('last_name', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-base"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Preferred name (optional)
        </label>
        <input
          type="text"
          value={fields.preferred_name ?? ''}
          onChange={(e) => set('preferred_name', e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-base"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          required
          value={fields.phone ?? ''}
          onChange={(e) => set('phone', e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-base"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={fields.email ?? ''}
          onChange={(e) => set('email', e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-base"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date of birth
        </label>
        <input
          type="date"
          value={fields.dob ?? ''}
          onChange={(e) => set('dob', e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-base"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input
          type="text"
          value={fields.address ?? ''}
          onChange={(e) => set('address', e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-base"
        />
      </div>

      <div className="border-t pt-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">Emergency contact (optional)</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={fields.emergency_contact_name ?? ''}
              onChange={(e) => set('emergency_contact_name', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={fields.emergency_contact_phone ?? ''}
              onChange={(e) => set('emergency_contact_phone', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-base"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Saving your information…' : 'Complete sign up'}
      </button>
    </form>
  )
}

// ─── Error recovery panel ─────────────────────────────────────────────────────

function ErrorRecoveryPanel({
  errorType,
  capturedFields,
  sessionId,
  onChoose,
}: {
  errorType: string | undefined
  capturedFields: OnboardingFields
  sessionId: string
  onChoose: (option: RecoveryOption) => void
}) {
  const hasPartialData = !!(capturedFields.first_name || capturedFields.phone)

  return (
    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-5">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">⚠️</span>
        <div>
          <p className="font-semibold text-amber-900">We hit a snag</p>
          <p className="text-sm text-amber-700 mt-1">
            {errorType === 'save_failed'
              ? 'There was a problem saving your information.'
              : errorType === 'unclear_input'
              ? 'We had trouble understanding some of your responses.'
              : "Something went wrong during the sign up call."}
            {' '}Choose how you'd like to continue:
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => onChoose('fill_manually')}
          className="w-full text-left border border-amber-300 rounded-xl p-4 bg-white hover:bg-amber-50 transition"
        >
          <p className="font-semibold text-gray-800">
            ✏️ {hasPartialData ? 'Review and complete the form' : 'Fill the form yourself'}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {hasPartialData
              ? "We've pre-filled what Quinn captured — just fill in the rest."
              : 'Takes about 2 minutes.'}
          </p>
        </button>

        <button
          onClick={() => onChoose('try_again')}
          className="w-full text-left border border-amber-300 rounded-xl p-4 bg-white hover:bg-amber-50 transition"
        >
          <p className="font-semibold text-gray-800">🔄 Try the voice sign up again</p>
          <p className="text-sm text-gray-500 mt-0.5">Start a new call with Quinn from the beginning.</p>
        </button>

        <button
          onClick={() => onChoose('call_in')}
          className="w-full text-left border border-amber-300 rounded-xl p-4 bg-white hover:bg-amber-50 transition"
        >
          <p className="font-semibold text-gray-800">📞 Call our sign up line</p>
          <p className="text-sm text-gray-500 mt-0.5">
            A team member will help you finish.{' '}
            <strong className="text-gray-700 select-all">(800) 555-8474</strong>
          </p>
        </button>
      </div>
    </div>
  )
}

// ─── Field display (shows values as Quinn captures them) ──────────────────────

function FieldRow({
  label,
  value,
  confirmed,
}: {
  label: string
  value?: string
  confirmed?: boolean
}) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
        {value}
        {confirmed && <span className="text-green-500 text-xs">✓ confirmed</span>}
      </span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function VoiceOnboardingForm({ sessionId, initialFields = {} }: VoiceOnboardingFormProps) {
  const router = useRouter()
  const [fields, setFields] = useState<OnboardingFields>(initialFields)
  const [status, setStatus] = useState<string>(initialFields.status ?? 'in_progress')
  const [recoveryOption, setRecoveryOption] = useState<RecoveryOption | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const submitCalledRef = useRef(false)

  // ── Auto-submit when Quinn signals ready ────────────────────────────────
  async function doAutoSubmit() {
    if (submitCalledRef.current) return
    submitCalledRef.current = true
    setSubmitting(true)

    try {
      const res = await fetch('/api/onboarding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Submission failed')
      }

      // Navigate to welcome page — Quinn will say "welcome to Thrive" as this loads
      router.push('/welcome')
    } catch (err) {
      console.error('[VoiceOnboardingForm] auto-submit failed:', err)
      setStatus('error')
      setFields((prev) => ({ ...prev, error_type: 'submit_failed' }))
      submitCalledRef.current = false
    } finally {
      setSubmitting(false)
    }
  }

  // ── SSE connection ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return

    const es = new EventSource(`/api/onboarding/events?session=${sessionId}`)
    eventSourceRef.current = es

    es.addEventListener('snapshot', (e) => {
      const data = JSON.parse(e.data) as OnboardingFields
      setFields(data)
      if (data.status) setStatus(data.status)
    })

    es.addEventListener('field_update', (e) => {
      const updated = JSON.parse(e.data) as OnboardingFields
      setFields((prev) => ({ ...prev, ...updated }))
      if (updated.status) setStatus(updated.status)
    })

    es.addEventListener('status', (e) => {
      const { status: newStatus, data } = JSON.parse(e.data) as {
        status: string
        data?: OnboardingFields
      }
      setStatus(newStatus)
      if (data) setFields((prev) => ({ ...prev, ...data }))

      if (newStatus === 'ready_to_submit') {
        doAutoSubmit()
      }
    })

    es.onerror = () => {
      // SSE disconnected — silently reconnect after 3 seconds
      setTimeout(() => {
        es.close()
        // useEffect cleanup will handle the ref; new effect run will reconnect
      }, 3_000)
    }

    return () => {
      es.close()
      eventSourceRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  // ── Recovery option handler ─────────────────────────────────────────────
  function handleRecoveryChoice(option: RecoveryOption) {
    setRecoveryOption(option)
    if (option === 'try_again') {
      // Reload the page to get a fresh session ID and a new Quinn call
      window.location.href = '/signup?retry=true'
    }
  }

  const nameConfirmed = fields.name_spelling_confirmed === true
  const fullName =
    fields.first_name && fields.last_name
      ? `${fields.first_name} ${fields.last_name}`
      : fields.first_name ?? fields.last_name

  // ── Render ──────────────────────────────────────────────────────────────

  // Manual form path (recovery)
  if (recoveryOption === 'fill_manually') {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Complete your sign up</h2>
        <p className="text-gray-500 text-sm mb-6">
          We've pre-filled what Quinn captured. Please review and fill in anything missing.
        </p>
        <ManualFallbackForm
          initialData={fields}
          sessionId={sessionId}
          onSuccess={() => router.push('/welcome')}
        />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div
            className={`w-2 h-2 rounded-full ${
              status === 'in_progress' ? 'bg-green-400 animate-pulse' : 'bg-gray-300'
            }`}
          />
          <span className="text-sm font-medium text-gray-500">
            {status === 'in_progress' && 'Quinn is listening…'}
            {status === 'pending_confirmation' && 'Quinn is reading back your information…'}
            {status === 'ready_to_submit' && 'Saving your account…'}
            {status === 'submitted' && 'All done!'}
            {status === 'error' && 'Something went wrong'}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          {status === 'in_progress' ? 'Your information' : 'Confirm your details'}
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Fields fill in automatically as Quinn captures them.
        </p>
      </div>

      {/* Live field display */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 mb-4">
        {!fullName && !fields.phone && (
          <p className="text-gray-400 text-sm text-center py-4">
            Waiting for Quinn to capture your information…
          </p>
        )}

        {fullName && (
          <FieldRow
            label="Name"
            value={fullName}
            confirmed={nameConfirmed}
          />
        )}
        {fields.preferred_name && fields.preferred_name !== fields.first_name && (
          <FieldRow label="Goes by" value={fields.preferred_name} />
        )}
        <FieldRow label="Phone" value={fields.phone} />
        <FieldRow label="Email" value={fields.email} />
        <FieldRow label="Date of birth" value={fields.dob} />
        <FieldRow label="Address" value={fields.address} />
        {fields.emergency_contact_name && (
          <FieldRow
            label="Emergency contact"
            value={`${fields.emergency_contact_name} · ${fields.emergency_contact_phone ?? ''}`}
          />
        )}
      </div>

      {/* Submitting overlay */}
      {submitting && (
        <div className="text-center py-6">
          <div className="inline-block w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-sm text-gray-500">Setting up your account…</p>
        </div>
      )}

      {/* Error recovery */}
      {status === 'error' && !recoveryOption && (
        <ErrorRecoveryPanel
          errorType={fields.error_type}
          capturedFields={fields}
          sessionId={sessionId}
          onChoose={handleRecoveryChoice}
        />
      )}

      {/* Pending confirmation state */}
      {status === 'pending_confirmation' && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-800">
          Quinn is reading your information back to you. Say <strong>"yes"</strong> to confirm
          or <strong>"change [field]"</strong> to correct anything.
        </div>
      )}

      {/* Footer note */}
      {status === 'in_progress' && (
        <p className="text-xs text-gray-400 text-center mt-4">
          Having trouble with the call?{' '}
          <button
            onClick={() => setRecoveryOption('fill_manually')}
            className="text-teal-600 underline"
          >
            Fill the form instead
          </button>
        </p>
      )}
    </div>
  )
}
