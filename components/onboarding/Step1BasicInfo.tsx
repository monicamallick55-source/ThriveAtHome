'use client'
// Step 1 of 3 — collects the senior's essential identifying information.
import type { OnboardingFormData } from './types'

interface Props {
  data: OnboardingFormData
  onChange: (field: keyof OnboardingFormData, value: string) => void
  errors: Partial<Record<keyof OnboardingFormData, string>>
}

const inputClass =
  'w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60'
const labelClass = 'block text-sm font-medium text-gray-700 mb-1'
const errorClass = 'text-red-600 text-sm mt-1'

export function Step1BasicInfo({ data, onChange, errors }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold mb-1" style={{ color: '#1B3A6B' }}>
          About the senior
        </h2>
        <p className="text-gray-500 text-sm">
          Tell us about the person you&apos;re enrolling.
        </p>
      </div>

      {/* Full name */}
      <div>
        <label htmlFor="full_name" className={labelClass}>
          Senior&apos;s full name <span className="text-red-500">*</span>
        </label>
        <input
          id="full_name"
          type="text"
          autoComplete="name"
          value={data.full_name}
          onChange={(e) => onChange('full_name', e.target.value)}
          className={inputClass}
          placeholder="Margaret Chen"
          aria-required="true"
          aria-describedby={errors.full_name ? 'full_name_error' : undefined}
        />
        {errors.full_name && (
          <p id="full_name_error" className={errorClass} role="alert">
            {errors.full_name}
          </p>
        )}
      </div>

      {/* Preferred name */}
      <div>
        <label htmlFor="preferred_name" className={labelClass}>
          What do they like to be called? <span className="text-red-500">*</span>
        </label>
        <input
          id="preferred_name"
          type="text"
          value={data.preferred_name}
          onChange={(e) => onChange('preferred_name', e.target.value)}
          className={inputClass}
          placeholder="Maggie"
          aria-required="true"
          aria-describedby={errors.preferred_name ? 'preferred_name_error' : undefined}
        />
        {errors.preferred_name && (
          <p id="preferred_name_error" className={errorClass} role="alert">
            {errors.preferred_name}
          </p>
        )}
      </div>

      {/* Date of birth */}
      <div>
        <label htmlFor="date_of_birth" className={labelClass}>
          Date of birth <span className="text-red-500">*</span>
        </label>
        <input
          id="date_of_birth"
          type="date"
          value={data.date_of_birth}
          onChange={(e) => onChange('date_of_birth', e.target.value)}
          className={inputClass}
          aria-required="true"
          aria-describedby={errors.date_of_birth ? 'dob_error' : undefined}
        />
        {errors.date_of_birth && (
          <p id="dob_error" className={errorClass} role="alert">
            {errors.date_of_birth}
          </p>
        )}
      </div>

      {/* Phone number */}
      <div>
        <label htmlFor="phone_number" className={labelClass}>
          Phone number <span className="text-red-500">*</span>
        </label>
        <input
          id="phone_number"
          type="tel"
          autoComplete="tel"
          value={data.phone_number}
          onChange={(e) => onChange('phone_number', e.target.value)}
          className={inputClass}
          placeholder="+1 (555) 000-0000"
          aria-required="true"
          aria-describedby={errors.phone_number ? 'phone_error' : 'phone_hint'}
        />
        <p id="phone_hint" className="text-gray-400 text-xs mt-1">
          Format: +15550001234 or (555) 000-1234
        </p>
        {errors.phone_number && (
          <p id="phone_error" className={errorClass} role="alert">
            {errors.phone_number}
          </p>
        )}
      </div>
    </div>
  )
}
