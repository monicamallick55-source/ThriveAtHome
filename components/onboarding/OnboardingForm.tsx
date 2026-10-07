'use client'
import { useState, useEffect, useCallback } from 'react'
import { differenceInYears } from 'date-fns'
import { Step1BasicInfo } from './Step1BasicInfo'
import { Step2Preferences } from './Step2Preferences'
import { Step3Safety } from './Step3Safety'
import { Confirmation } from './Confirmation'
import { type OnboardingFormData, EMPTY_FORM, STORAGE_KEY } from './types'

const TOTAL_STEPS = 3
const stepLabels = (isSelf: boolean) => [
  isSelf ? 'About you' : 'About the senior',
  'Call preferences',
  'Safety',
]

type ValidationErrors = Partial<Record<keyof OnboardingFormData, string>>

function isValidPhone(raw: string): boolean {
  const cleaned = raw.replace(/[\s\-().+]/g, '')
  if (/^\d{10}$/.test(cleaned)) return true
  if (/^\+[1-9]\d{9,14}$/.test(raw.replace(/\s/g, ''))) return true
  return false
}

function validateStep1(data: OnboardingFormData, isSelf: boolean): ValidationErrors {
  const errors: ValidationErrors = {}

  if (!data.full_name.trim()) {
    errors.full_name = isSelf ? 'Please enter your full name.' : 'Please enter the senior\'s full name.'
  }
  if (!data.preferred_name.trim()) {
    errors.preferred_name = isSelf
      ? 'Please enter what you like to be called.'
      : 'Please enter what they like to be called.'
  }
  if (!data.date_of_birth) {
    errors.date_of_birth = isSelf ? 'Please enter your date of birth.' : 'Please enter their date of birth.'
  } else {
    const dob = new Date(data.date_of_birth)
    if (isNaN(dob.getTime())) {
      errors.date_of_birth = 'Please enter a valid date.'
    } else if (differenceInYears(new Date(), dob) < 60) {
      errors.date_of_birth = isSelf
        ? 'You must be at least 60 years old to enrol.'
        : 'The person being enrolled must be at least 60 years old.'
    }
  }
  if (!data.phone_number.trim()) {
    errors.phone_number = 'Please enter a phone number.'
  } else if (!isValidPhone(data.phone_number)) {
    errors.phone_number = 'Please enter a valid phone number — e.g. (555) 000-1234 or +15550001234.'
  }

  return errors
}

const validators: Array<(data: OnboardingFormData, isSelf: boolean) => ValidationErrors> = [
  validateStep1,
  () => ({}),
  () => ({}),
]

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8l3.5 3.5L13 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function OnboardingForm({ isSelf = false }: { isSelf?: boolean }) {
  const STEP_LABELS = stepLabels(isSelf)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<OnboardingFormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmedName, setConfirmedName] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<OnboardingFormData>
        setFormData((prev) => ({ ...prev, ...parsed }))
      }
    } catch {
      // Ignore parse errors
    }
    setHydrated(true)
  }, [])

  const handleChange = useCallback((field: keyof OnboardingFormData, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  function handleNext() {
    const errs = validators[step - 1](formData, isSelf)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      const firstKey = Object.keys(errs)[0]
      document.getElementById(firstKey)?.focus()
      return
    }
    setErrors({})
    setStep((s) => s + 1)
    window.scrollTo(0, 0)
  }

  function handleBack() {
    setErrors({})
    setStep((s) => s - 1)
    window.scrollTo(0, 0)
  }

  async function handleSubmit() {
    const errs = validators[step - 1](formData, isSelf)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          lives_alone: formData.lives_alone === 'yes' ? true : formData.lives_alone === 'no' ? false : null,
        }),
      })

      const data = (await res.json()) as { success?: boolean; error?: string; preferred_name?: string }

      if (!res.ok || !data.success) {
        setSubmitError(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
      setConfirmedName(data.preferred_name ?? formData.preferred_name)
    } catch (err) {
      console.error('[OnboardingForm] Unexpected error:', err)
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!hydrated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-cream)' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '3px solid var(--color-warm-grey)',
            borderTopColor: 'var(--color-teal)',
            animation: 'spin 0.8s linear infinite',
          }}
          aria-label="Loading"
          role="status"
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (confirmedName) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', backgroundColor: 'var(--color-cream)' }}>
        <div
          style={{
            width: '100%',
            maxWidth: '640px',
            backgroundColor: 'var(--color-warm-white)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-md)',
            padding: '48px',
          }}
        >
          <Confirmation
            preferredName={confirmedName}
            isSelf={isSelf}
            ariaOptedIn={formData.aria_call_opt_in === 'daily' || formData.aria_call_opt_in === 'less_often'}
            ariaFrequency={formData.aria_call_opt_in === 'daily' ? 'daily' : formData.check_in_frequency}
          />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', padding: '32px 16px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Top nav: back link + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <a
            href="/"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '15px',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ← Home
          </a>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '24px',
              color: 'var(--color-navy)',
              fontWeight: 500,
              margin: 0,
            }}
          >
            ThriveAtHome
          </p>
          <div style={{ width: '100px' }} aria-hidden="true" />
        </div>

        {/* Step progress */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
            {STEP_LABELS.map((label: any, index: number) => {
              const stepNum = index + 1
              const isComplete = step > stepNum
              const isActive = step === stepNum
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isComplete ? 'var(--color-teal)' : isActive ? 'var(--color-navy)' : 'var(--color-warm-grey)',
                        color: isComplete || isActive ? 'white' : 'var(--color-text-muted)',
                        fontSize: '15px',
                        fontWeight: 600,
                        fontFamily: 'var(--font-body)',
                        transition: 'all 0.3s',
                      }}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      {isComplete ? <CheckIcon /> : stepNum}
                    </div>
                    <span
                      style={{
                        fontSize: '13px',
                        marginTop: '6px',
                        color: isActive ? 'var(--color-navy)' : isComplete ? 'var(--color-teal)' : 'var(--color-text-muted)',
                        fontFamily: 'var(--font-body)',
                        fontWeight: isActive ? 600 : 400,
                        whiteSpace: 'nowrap',
                        textAlign: 'center',
                      }}
                    >
                      {label}
                    </span>
                  </div>
                  {index < STEP_LABELS.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        height: '2px',
                        backgroundColor: step > stepNum ? 'var(--color-teal)' : 'var(--color-warm-grey)',
                        marginBottom: '24px',
                        transition: 'background-color 0.3s',
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Form card */}
        <div
          style={{
            backgroundColor: 'var(--color-warm-white)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-md)',
            padding: '48px',
          }}
          className="onboarding-card"
        >
          {step === 1 && (
            <Step1BasicInfo data={formData} onChange={handleChange} errors={errors} isSelf={isSelf} />
          )}
          {step === 2 && (
            <Step2Preferences data={formData} onChange={handleChange} errors={errors} isSelf={isSelf} />
          )}
          {step === 3 && (
            <Step3Safety data={formData} onChange={handleChange} errors={errors} isSelf={isSelf} />
          )}

          {submitError && (
            <p
              role="alert"
              style={{
                marginTop: '24px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                backgroundColor: 'var(--color-urgent)',
                color: 'var(--color-urgent-text)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                fontSize: '18px',
                fontFamily: 'var(--font-body)',
                border: '1px solid var(--color-urgent-border)',
              }}
            >
              <span aria-hidden="true">⚠</span> {submitError}
            </p>
          )}

          <div style={{ marginTop: '40px', display: 'flex', gap: '12px' }}>
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                style={{
                  flex: 1,
                  height: '56px',
                  backgroundColor: 'transparent',
                  border: '1.5px solid var(--color-warm-grey)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text-secondary)',
                  fontSize: '18px',
                  fontWeight: 500,
                  fontFamily: 'var(--font-body)',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.6 : 1,
                  transition: 'all 0.2s',
                }}
              >
                Back
              </button>
            )}

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNext}
                style={{
                  flex: 1,
                  height: '56px',
                  backgroundColor: 'var(--color-teal)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: 500,
                  fontFamily: 'var(--font-body)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  flex: 1,
                  height: '56px',
                  backgroundColor: 'var(--color-navy)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-cream)',
                  fontSize: '18px',
                  fontWeight: 500,
                  fontFamily: 'var(--font-body)',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.6 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {submitting ? 'Saving profile…' : 'Save profile'}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .onboarding-card { padding: 24px !important; }
        }
      `}</style>
    </div>
  )
}
