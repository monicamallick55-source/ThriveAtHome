'use client'
// Step 3 of 3 — communication preferences, interests, and doctor details.
import type { OnboardingFormData } from './types'

interface Props {
  data: OnboardingFormData
  onChange: (field: keyof OnboardingFormData, value: string) => void
  errors: Partial<Record<keyof OnboardingFormData, string>>
}

const inputClass =
  'w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500'
const labelClass = 'block text-sm font-medium text-gray-700 mb-1'
const selectClass =
  'w-full border border-gray-300 rounded-lg px-4 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
const textareaClass =
  'w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'

const LANGUAGES = [
  'english', 'spanish', 'mandarin', 'cantonese', 'tagalog', 'vietnamese',
  'french', 'arabic', 'hindi', 'portuguese', 'korean', 'russian', 'other',
]

const CALL_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'every_other_day', label: 'Every other day' },
  { value: 'weekly', label: 'Weekly' },
]

export function Step3Preferences({ data, onChange, errors }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold mb-1" style={{ color: '#1B3A6B' }}>
          Preferences
        </h2>
        <p className="text-gray-500 text-sm">
          This helps Aria — our AI companion — have better conversations with {data.preferred_name || 'the senior'}.
        </p>
      </div>

      {/* Language */}
      <div>
        <label htmlFor="preferred_language" className={labelClass}>Preferred language</label>
        <select
          id="preferred_language"
          value={data.preferred_language}
          onChange={(e) => onChange('preferred_language', e.target.value)}
          className={selectClass}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Call frequency */}
      <div>
        <label htmlFor="check_in_frequency" className={labelClass}>How often should Aria call?</label>
        <select
          id="check_in_frequency"
          value={data.check_in_frequency}
          onChange={(e) => onChange('check_in_frequency', e.target.value)}
          className={selectClass}
        >
          {CALL_FREQUENCIES.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Preferred call time */}
      <div>
        <label htmlFor="preferred_call_time" className={labelClass}>Preferred call time</label>
        <input
          id="preferred_call_time"
          type="text"
          value={data.preferred_call_time}
          onChange={(e) => onChange('preferred_call_time', e.target.value)}
          className={inputClass}
          placeholder="e.g. 10am, after breakfast, evenings"
        />
      </div>

      {/* Topics they enjoy */}
      <div>
        <label htmlFor="topics_enjoy" className={labelClass}>Topics {data.preferred_name || 'they'} enjoy talking about</label>
        <textarea
          id="topics_enjoy"
          rows={2}
          value={data.topics_enjoy}
          onChange={(e) => onChange('topics_enjoy', e.target.value)}
          className={textareaClass}
          placeholder="e.g. gardening, family memories, cooking, baseball"
        />
      </div>

      {/* Topics to avoid */}
      <div>
        <label htmlFor="topics_avoid" className={labelClass}>Topics to avoid</label>
        <textarea
          id="topics_avoid"
          rows={2}
          value={data.topics_avoid}
          onChange={(e) => onChange('topics_avoid', e.target.value)}
          className={textareaClass}
          placeholder="e.g. politics, recent news"
        />
      </div>

      {/* Doctor */}
      <fieldset className="border border-gray-200 rounded-xl p-4">
        <legend className="text-sm font-semibold text-gray-700 px-1">Primary care doctor (optional)</legend>
        <div className="flex flex-col gap-3 mt-2">
          <div>
            <label htmlFor="doctor_name" className={labelClass}>Doctor&apos;s name</label>
            <input
              id="doctor_name"
              type="text"
              value={data.doctor_name}
              onChange={(e) => onChange('doctor_name', e.target.value)}
              className={inputClass}
              placeholder="Dr. Sarah Johnson"
            />
            {errors.doctor_name && (
              <p className="text-red-600 text-sm mt-1" role="alert">{errors.doctor_name}</p>
            )}
          </div>
          <div>
            <label htmlFor="doctor_phone" className={labelClass}>Doctor&apos;s phone</label>
            <input
              id="doctor_phone"
              type="tel"
              value={data.doctor_phone}
              onChange={(e) => onChange('doctor_phone', e.target.value)}
              className={inputClass}
              placeholder="+15550001234"
            />
          </div>
        </div>
      </fieldset>

      {/* Recent loss — Grief Welcome Path */}
      <div style={{ padding: '20px', backgroundColor: '#F9F6F0', borderRadius: '12px', border: '1px solid #E8E4DC' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#5E5852', marginBottom: '14px', lineHeight: 1.6 }}>
          If {data.preferred_name || 'the senior'} has recently experienced a loss, we can make sure they receive extra support from the very start.
        </p>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={data.grief_welcome_path === 'true'}
            onChange={(e) => onChange('grief_welcome_path', e.target.checked ? 'true' : '')}
            style={{ width: '20px', height: '20px', marginTop: '2px', cursor: 'pointer', flexShrink: 0 }}
          />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#1B3A6B', lineHeight: 1.5 }}>
            {data.preferred_name || 'They'} recently lost someone important to them and would benefit from extra support
          </span>
        </label>
        {data.grief_welcome_path === 'true' && (
          <div style={{ marginTop: '12px', padding: '12px 16px', backgroundColor: '#E8F4F1', borderRadius: '8px', border: '1px solid #2A9D8F30' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#2A7A6A', margin: 0, lineHeight: 1.6 }}>
              ✓ We'll assign a Human Buddy within 48 hours, send an invitation to our Grief Support Circle, and have a navigator check in during the first week.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
