'use client'
// Step 2 of 3 — emergency contacts, address, and health background.
import type { OnboardingFormData } from './types'

interface Props {
  data: OnboardingFormData
  onChange: (field: keyof OnboardingFormData, value: string) => void
  errors: Partial<Record<keyof OnboardingFormData, string>>
}

const inputClass =
  'w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500'
const labelClass = 'block text-sm font-medium text-gray-700 mb-1'
const errorClass = 'text-red-600 text-sm mt-1'
const textareaClass =
  'w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'

export function Step2EmergencyHealth({ data, onChange, errors }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold mb-1" style={{ color: '#1B3A6B' }}>
          Safety &amp; health
        </h2>
        <p className="text-gray-500 text-sm">
          All fields on this page are optional, but help us respond quickly if there is ever a concern.
        </p>
      </div>

      {/* Emergency contact 1 */}
      <fieldset className="border border-gray-200 rounded-xl p-4">
        <legend className="text-sm font-semibold text-gray-700 px-1">Emergency contact</legend>
        <div className="flex flex-col gap-3 mt-2">
          <div>
            <label htmlFor="ec1_name" className={labelClass}>Name</label>
            <input
              id="ec1_name"
              type="text"
              value={data.emergency_contact_1_name}
              onChange={(e) => onChange('emergency_contact_1_name', e.target.value)}
              className={inputClass}
              placeholder="James Chen"
            />
            {errors.emergency_contact_1_name && (
              <p className={errorClass} role="alert">{errors.emergency_contact_1_name}</p>
            )}
          </div>
          <div>
            <label htmlFor="ec1_phone" className={labelClass}>Phone</label>
            <input
              id="ec1_phone"
              type="tel"
              value={data.emergency_contact_1_phone}
              onChange={(e) => onChange('emergency_contact_1_phone', e.target.value)}
              className={inputClass}
              placeholder="+15550001234"
            />
          </div>
          <div>
            <label htmlFor="ec1_rel" className={labelClass}>Relationship</label>
            <input
              id="ec1_rel"
              type="text"
              value={data.emergency_contact_1_rel}
              onChange={(e) => onChange('emergency_contact_1_rel', e.target.value)}
              className={inputClass}
              placeholder="Son"
            />
          </div>
        </div>
      </fieldset>

      {/* Home address */}
      <div>
        <label htmlFor="address" className={labelClass}>Home address</label>
        <input
          id="address"
          type="text"
          autoComplete="street-address"
          value={data.address}
          onChange={(e) => onChange('address', e.target.value)}
          className={inputClass}
          placeholder="123 Maple Street, Springfield, IL 62701"
        />
      </div>

      {/* Lives alone */}
      <div>
        <p className={labelClass}>Does {data.preferred_name || 'the senior'} live alone?</p>
        <div className="flex gap-3 mt-1">
          {(['yes', 'no'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange('lives_alone', opt)}
              className="flex-1 rounded-lg border py-3 text-base font-medium transition-colors"
              style={{
                borderColor: data.lives_alone === opt ? '#1B3A6B' : '#d1d5db',
                backgroundColor: data.lives_alone === opt ? '#EBF0F8' : 'white',
                color: data.lives_alone === opt ? '#1B3A6B' : '#374151',
                minHeight: '52px',
              }}
              aria-pressed={data.lives_alone === opt}
            >
              {opt === 'yes' ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
      </div>

      {/* Health conditions */}
      <div>
        <label htmlFor="health_conditions" className={labelClass}>Health conditions</label>
        <textarea
          id="health_conditions"
          rows={3}
          value={data.health_conditions}
          onChange={(e) => onChange('health_conditions', e.target.value)}
          className={textareaClass}
          placeholder="e.g. diabetes, arthritis, high blood pressure"
        />
      </div>

      {/* Medications */}
      <div>
        <label htmlFor="medications" className={labelClass}>Medications</label>
        <textarea
          id="medications"
          rows={3}
          value={data.medications}
          onChange={(e) => onChange('medications', e.target.value)}
          className={textareaClass}
          placeholder="e.g. metformin 500mg twice daily, lisinopril 10mg"
        />
      </div>
    </div>
  )
}
