'use client'
import type { OnboardingFormData } from './types'

interface Props {
  data: OnboardingFormData
  onChange: (field: keyof OnboardingFormData, value: string) => void
  errors: Partial<Record<keyof OnboardingFormData, string>>
  /** True when the signed-in user is enrolling themselves — the form speaks in the first person. */
  isSelf?: boolean
}

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

const labelStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-body)',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '56px',
  backgroundColor: 'white',
  border: '1.5px solid var(--color-warm-grey)',
  borderRadius: 'var(--radius-md)',
  padding: '0 16px',
  fontSize: '18px',
  fontFamily: 'var(--font-body)',
  color: 'var(--color-text-primary)',
  outline: 'none',
  transition: 'all 0.2s',
  boxSizing: 'border-box',
}

const hintStyle: React.CSSProperties = {
  fontSize: '15px',
  color: 'var(--color-text-muted)',
  fontFamily: 'var(--font-body)',
  margin: 0,
}

const errorStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '6px',
  color: 'var(--color-urgent-text)',
  fontSize: '15px',
  fontFamily: 'var(--font-body)',
}

const LANGUAGES = [
  { value: 'english', label: 'English' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'mandarin', label: 'Mandarin' },
  { value: 'cantonese', label: 'Cantonese' },
  { value: 'tagalog', label: 'Tagalog' },
  { value: 'vietnamese', label: 'Vietnamese' },
  { value: 'french', label: 'French' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'portuguese', label: 'Portuguese' },
  { value: 'korean', label: 'Korean' },
  { value: 'russian', label: 'Russian' },
  { value: 'other', label: 'Other' },
]

export function Step1BasicInfo({ data, onChange, errors, isSelf = false }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            fontWeight: 500,
            color: 'var(--color-navy)',
            marginBottom: '8px',
          }}
        >
          {isSelf ? 'Tell us a little about you.' : 'Tell us about the person you care for.'}
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '18px', margin: 0, fontFamily: 'var(--font-body)' }}>
          This helps your care team make that first call feel warm and personal.
        </p>
      </div>

      <div style={fieldStyle}>
        <label htmlFor="full_name" style={labelStyle}>
          Full legal name <span style={{ color: 'var(--color-urgent-text)' }}>*</span>
        </label>
        <input
          id="full_name"
          type="text"
          autoComplete="name"
          value={data.full_name}
          onChange={(e) => onChange('full_name', e.target.value)}
          style={{ ...inputStyle, borderColor: errors.full_name ? 'var(--color-urgent-border)' : 'var(--color-warm-grey)' }}
          placeholder="Margaret Chen"
          aria-required="true"
          aria-describedby={errors.full_name ? 'full_name_error' : undefined}
        />
        {errors.full_name && (
          <p id="full_name_error" style={errorStyle} role="alert">
            <span aria-hidden="true">⚠</span> {errors.full_name}
          </p>
        )}
      </div>

      <div style={fieldStyle}>
        <label htmlFor="preferred_name" style={labelStyle}>
          Preferred name <span style={{ color: 'var(--color-urgent-text)' }}>*</span>
        </label>
        <p style={hintStyle}>{isSelf ? 'What do you like to be called?' : 'What do they like to be called?'}</p>
        <input
          id="preferred_name"
          type="text"
          value={data.preferred_name}
          onChange={(e) => onChange('preferred_name', e.target.value)}
          style={{ ...inputStyle, borderColor: errors.preferred_name ? 'var(--color-urgent-border)' : 'var(--color-warm-grey)' }}
          placeholder="Maggie"
          aria-required="true"
          aria-describedby={errors.preferred_name ? 'preferred_name_error' : 'preferred_name_hint'}
        />
        {errors.preferred_name && (
          <p id="preferred_name_error" style={errorStyle} role="alert">
            <span aria-hidden="true">⚠</span> {errors.preferred_name}
          </p>
        )}
      </div>

      <div style={fieldStyle}>
        <label htmlFor="date_of_birth" style={labelStyle}>
          Date of birth <span style={{ color: 'var(--color-urgent-text)' }}>*</span>
        </label>
        <input
          id="date_of_birth"
          type="date"
          value={data.date_of_birth}
          onChange={(e) => onChange('date_of_birth', e.target.value)}
          style={{ ...inputStyle, borderColor: errors.date_of_birth ? 'var(--color-urgent-border)' : 'var(--color-warm-grey)' }}
          aria-required="true"
          aria-describedby={errors.date_of_birth ? 'dob_error' : undefined}
        />
        {errors.date_of_birth && (
          <p id="dob_error" style={errorStyle} role="alert">
            <span aria-hidden="true">⚠</span> {errors.date_of_birth}
          </p>
        )}
      </div>

      <div style={fieldStyle}>
        <label htmlFor="phone_number" style={labelStyle}>
          Phone number <span style={{ color: 'var(--color-urgent-text)' }}>*</span>
        </label>
        <p style={hintStyle}>{isSelf ? 'This is the number we will call you on.' : 'This is the number we will call them on.'}</p>
        <input
          id="phone_number"
          type="tel"
          autoComplete="tel"
          value={data.phone_number}
          onChange={(e) => onChange('phone_number', e.target.value)}
          style={{ ...inputStyle, borderColor: errors.phone_number ? 'var(--color-urgent-border)' : 'var(--color-warm-grey)' }}
          placeholder="(555) 000-1234"
          aria-required="true"
          aria-describedby={errors.phone_number ? 'phone_error' : 'phone_hint'}
        />
        {errors.phone_number && (
          <p id="phone_error" style={errorStyle} role="alert">
            <span aria-hidden="true">⚠</span> {errors.phone_number}
          </p>
        )}
      </div>

      <div style={fieldStyle}>
        <label htmlFor="preferred_language" style={labelStyle}>Preferred language</label>
        <select
          id="preferred_language"
          value={data.preferred_language}
          onChange={(e) => onChange('preferred_language', e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer', backgroundColor: 'white' }}
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      <div style={fieldStyle}>
        <label htmlFor="address" style={labelStyle}>Home address</label>
        <p style={hintStyle}>City, state, and zip are fine — full street address is optional.</p>
        <input
          id="address"
          type="text"
          autoComplete="street-address"
          value={data.address}
          onChange={(e) => onChange('address', e.target.value)}
          style={inputStyle}
          placeholder="Springfield, IL 62701"
        />
      </div>
    </div>
  )
}
