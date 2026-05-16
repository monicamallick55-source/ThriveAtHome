'use client'
// Multi-step onboarding form. Saves progress to localStorage on every change.
// Validates step before advancing. Submits to /api/onboarding on final step.
import { useState, useEffect, useCallback } from 'react'
import { differenceInYears } from 'date-fns'
import { Step1BasicInfo } from './Step1BasicInfo'
import { Step2EmergencyHealth } from './Step2EmergencyHealth'
import { Step3Preferences } from './Step3Preferences'
import { Confirmation } from './Confirmation'
import { type OnboardingFormData, EMPTY_FORM, STORAGE_KEY } from './types'

const TOTAL_STEPS = 3

type ValidationErrors = Partial<Record<keyof OnboardingFormData, string>>

/** Normalises a phone number to digits only, then validates E.164 or 10-digit US. */
function isValidPhone(raw: string): boolean {
  const cleaned = raw.replace(/[\s\-().+]/g, '')
  if (/^\d{10}$/.test(cleaned)) return true
  if (/^\+[1-9]\d{9,14}$/.test(raw.replace(/\s/g, ''))) return true
  return false
}

function validateStep1(data: OnboardingFormData): ValidationErrors {
  const errors: ValidationErrors = {}

  if (!data.full_name.trim()) {
    errors.full_name = 'Please enter the senior\'s full name.'
  }
  if (!data.preferred_name.trim()) {
    errors.preferred_name = 'Please enter what they like to be called.'
  }
  if (!data.date_of_birth) {
    errors.date_of_birth = 'Please enter their date of birth.'
  } else {
    const dob = new Date(data.date_of_birth)
    if (isNaN(dob.getTime())) {
      errors.date_of_birth = 'Please enter a valid date.'
    } else if (differenceInYears(new Date(), dob) < 60) {
      errors.date_of_birth = 'The person being enrolled must be at least 60 years old.'
    }
  }
  if (!data.phone_number.trim()) {
    errors.phone_number = 'Please enter a phone number.'
  } else if (!isValidPhone(data.phone_number)) {
    errors.phone_number = 'Please enter a valid phone number — e.g. (555) 000-1234 or +15550001234.'
  }

  return errors
}

function validateStep2(_data: OnboardingFormData): ValidationErrors {
  // Step 2 fields are all optional — no blocking validation
  return {}
}

function validateStep3(_data: OnboardingFormData): ValidationErrors {
  // Step 3 fields are all optional — no blocking validation
  return {}
}

const validators = [validateStep1, validateStep2, validateStep3]

export function OnboardingForm() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<OnboardingFormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmedName, setConfirmedName] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  // Load saved form state from localStorage on first render (before rendering fields)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<OnboardingFormData>
        setFormData((prev) => ({ ...prev, ...parsed }))
      }
    } catch {
      // Ignore parse errors — start fresh
    }
    setHydrated(true)
  }, [])

  // Persist form state to localStorage on every change
  const handleChange = useCallback((field: keyof OnboardingFormData, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Storage may be full — continue silently
      }
      return next
    })
    // Clear error for the field being edited
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  function handleNext() {
    const errs = validators[step - 1](formData)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      // Scroll to first error
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
    const errs = validators[step - 1](formData)
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

      // Clear saved form state on success
      try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }

      setConfirmedName(data.preferred_name ?? formData.preferred_name)
    } catch (err) {
      console.error('[OnboardingForm] Unexpected error:', err)
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Prevent hydration flash by not rendering form fields until localStorage is read
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAF8' }}>
        <div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin" aria-label="Loading" />
      </div>
    )
  }

  // Confirmation screen
  if (confirmedName) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor: '#FAFAF8' }}>
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <Confirmation preferredName={confirmedName} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-xs font-medium text-gray-400">Step {step} of {TOTAL_STEPS}</span>
            <span className="text-xs font-medium" style={{ color: '#0D7C8F' }}>
              {step === 1 ? 'About the senior' : step === 2 ? 'Safety & health' : 'Preferences'}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%`, backgroundColor: '#0D7C8F' }}
              role="progressbar"
              aria-valuenow={step}
              aria-valuemin={1}
              aria-valuemax={TOTAL_STEPS}
              aria-label={`Step ${step} of ${TOTAL_STEPS}`}
            />
          </div>
        </div>

        {/* Step content */}
        {step === 1 && (
          <Step1BasicInfo data={formData} onChange={handleChange} errors={errors} />
        )}
        {step === 2 && (
          <Step2EmergencyHealth data={formData} onChange={handleChange} errors={errors} />
        )}
        {step === 3 && (
          <Step3Preferences data={formData} onChange={handleChange} errors={errors} />
        )}

        {/* Submit error */}
        {submitError && (
          <p className="mt-4 text-red-600 text-sm bg-red-50 rounded-lg p-3" role="alert">
            {submitError}
          </p>
        )}

        {/* Navigation */}
        <div className="mt-6 flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-4 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
              style={{ minHeight: '52px' }}
            >
              Back
            </button>
          )}

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 text-white font-semibold rounded-lg px-4 py-4 text-base transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1B3A6B', minHeight: '52px' }}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 text-white font-semibold rounded-lg px-4 py-4 text-base transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#1B3A6B', minHeight: '52px' }}
            >
              {submitting ? 'Saving profile…' : 'Save profile'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
