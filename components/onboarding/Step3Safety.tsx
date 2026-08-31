'use client'
import { useState } from 'react'
import type { OnboardingFormData } from './types'

interface Props {
  data: OnboardingFormData
  onChange: (field: keyof OnboardingFormData, value: string) => void
  errors: Partial<Record<keyof OnboardingFormData, string>>
  /** True when the signed-in user is enrolling themselves — the form speaks in the first person. */
  isSelf?: boolean
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

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-cream)',
  border: '1px solid var(--color-warm-grey)',
  borderRadius: 'var(--radius-lg)',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
}

const RELATIONSHIPS = [
  'Son', 'Daughter', 'Spouse', 'Partner', 'Sibling', 'Friend', 'Neighbor', 'Caregiver', 'Other',
]

export function Step3Safety({ data, onChange, isSelf = false }: Props) {
  const [showSecondContact, setShowSecondContact] = useState(
    !!(data.emergency_contact_1_name || data.emergency_contact_1_phone)
  )
  const livesAlone = data.lives_alone
  const subject = data.preferred_name || (isSelf ? 'you' : 'the senior')
  const subjectThey = data.preferred_name || (isSelf ? 'you' : 'they')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
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
          Just in case — who should we reach?
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '18px', margin: 0, fontFamily: 'var(--font-body)' }}>
          All fields on this page are optional, but help us respond quickly if there is ever a concern.
        </p>
      </div>

      {/* Emergency contact 1 */}
      <div>
        <p style={{ ...labelStyle, marginBottom: '12px' }}>Emergency contact</p>
        <div style={cardStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="ec1_name" style={labelStyle}>Name</label>
            <input
              id="ec1_name"
              type="text"
              value={data.emergency_contact_1_name}
              onChange={(e) => onChange('emergency_contact_1_name', e.target.value)}
              style={inputStyle}
              placeholder="James Chen"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="ec1_rel" style={labelStyle}>Relationship</label>
            <select
              id="ec1_rel"
              value={data.emergency_contact_1_rel}
              onChange={(e) => onChange('emergency_contact_1_rel', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer', backgroundColor: 'white' }}
            >
              <option value="">Select relationship…</option>
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="ec1_phone" style={labelStyle}>Phone number</label>
            <input
              id="ec1_phone"
              type="tel"
              value={data.emergency_contact_1_phone}
              onChange={(e) => onChange('emergency_contact_1_phone', e.target.value)}
              style={inputStyle}
              placeholder="(555) 000-1234"
            />
          </div>
        </div>

        {!showSecondContact ? (
          <button
            type="button"
            onClick={() => setShowSecondContact(true)}
            style={{
              marginTop: '12px',
              background: 'none',
              border: 'none',
              color: 'var(--color-teal)',
              fontSize: '18px',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              cursor: 'pointer',
              padding: '8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            + Add another contact
          </button>
        ) : (
          <div style={{ marginTop: '16px' }}>
            <p style={{ ...labelStyle, marginBottom: '12px' }}>Secondary contact <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span></p>
            <div style={cardStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="ec2_name" style={labelStyle}>Name</label>
                <input
                  id="ec2_name"
                  type="text"
                  style={inputStyle}
                  placeholder="Anna Chen"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="ec2_phone" style={labelStyle}>Phone number</label>
                <input
                  id="ec2_phone"
                  type="tel"
                  style={inputStyle}
                  placeholder="(555) 000-1234"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lives alone toggle */}
      <div>
        <p style={{ ...labelStyle, marginBottom: '12px' }}>
          {isSelf && !data.preferred_name ? 'Do you live alone?' : `Does ${subject} live alone?`}
        </p>
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--color-warm-grey)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            height: '56px',
            position: 'relative',
          }}
          role="group"
          aria-label={isSelf ? 'Do you live alone?' : 'Does the senior live alone?'}
        >
          {[
            { value: 'yes', label: 'Yes, lives alone' },
            { value: 'no', label: 'Not alone' },
          ].map((option) => {
            const isSelected = livesAlone === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange('lives_alone', option.value)}
                aria-pressed={isSelected}
                style={{
                  flex: 1,
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isSelected ? 'white' : 'transparent',
                  color: isSelected ? 'var(--color-navy)' : 'var(--color-text-muted)',
                  fontSize: '18px',
                  fontFamily: 'var(--font-body)',
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Primary care doctor */}
      <div>
        <p style={{ ...labelStyle, marginBottom: '12px' }}>
          Primary care doctor <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span>
        </p>
        <div style={cardStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="doctor_name" style={labelStyle}>Doctor&apos;s name</label>
            <input
              id="doctor_name"
              type="text"
              value={data.doctor_name}
              onChange={(e) => onChange('doctor_name', e.target.value)}
              style={inputStyle}
              placeholder="Dr. Sarah Johnson"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="doctor_phone" style={labelStyle}>Doctor&apos;s phone</label>
            <input
              id="doctor_phone"
              type="tel"
              value={data.doctor_phone}
              onChange={(e) => onChange('doctor_phone', e.target.value)}
              style={inputStyle}
              placeholder="(555) 000-1234"
            />
          </div>
        </div>
      </div>

      {/* Medications */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label htmlFor="medications" style={labelStyle}>
          Current medications <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span>
        </label>
        <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
          A general list is fine — just helps your care team ask the right questions.
        </p>
        <textarea
          id="medications"
          rows={3}
          value={data.medications}
          onChange={(e) => onChange('medications', e.target.value)}
          style={{
            width: '100%',
            backgroundColor: 'white',
            border: '1.5px solid var(--color-warm-grey)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            fontSize: '18px',
            fontFamily: 'var(--font-body)',
            color: 'var(--color-text-primary)',
            outline: 'none',
            resize: 'vertical',
            minHeight: '112px',
            boxSizing: 'border-box',
          }}
          placeholder="e.g. metformin 500mg twice daily, lisinopril 10mg"
        />
      </div>

      {/* Health conditions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label htmlFor="health_conditions" style={labelStyle}>
          Known health conditions <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span>
        </label>
        <textarea
          id="health_conditions"
          rows={3}
          value={data.health_conditions}
          onChange={(e) => onChange('health_conditions', e.target.value)}
          style={{
            width: '100%',
            backgroundColor: 'white',
            border: '1.5px solid var(--color-warm-grey)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            fontSize: '18px',
            fontFamily: 'var(--font-body)',
            color: 'var(--color-text-primary)',
            outline: 'none',
            resize: 'vertical',
            minHeight: '112px',
            boxSizing: 'border-box',
          }}
          placeholder="e.g. diabetes, arthritis, high blood pressure"
        />
      </div>

      {/* Grief Welcome Path */}
      <div
        style={{
          backgroundColor: '#FAF5FF',
          border: '1.5px solid #E9D5FF',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <p style={{ ...labelStyle, margin: 0 }}>
          {isSelf && !data.preferred_name
            ? 'Have you recently lost someone important?'
            : `Has ${subject} recently lost someone important?`}
        </p>
        <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
          If so, we will prioritise a daily check-in and aim to connect {isSelf && !data.preferred_name ? 'you' : subjectThey} with a buddy within 48 hours.
        </p>
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--color-warm-grey)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            height: '56px',
          }}
          role="group"
          aria-label="Recent loss — Grief Welcome Path"
        >
          {[
            { value: '', label: 'No recent loss' },
            { value: 'true', label: 'Yes, recent loss' },
          ].map((option) => {
            const isSelected = data.grief_welcome_path === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange('grief_welcome_path', option.value)}
                aria-pressed={isSelected}
                style={{
                  flex: 1,
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isSelected ? (option.value === 'true' ? '#7C3AED' : 'white') : 'transparent',
                  color: isSelected ? (option.value === 'true' ? 'white' : 'var(--color-navy)') : 'var(--color-text-muted)',
                  fontSize: '17px',
                  fontFamily: 'var(--font-body)',
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        {data.grief_welcome_path === 'true' && (
          <div
            style={{
              backgroundColor: 'white',
              border: '1px solid #E9D5FF',
              borderRadius: 'var(--radius-md)',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <p style={{ fontSize: '16px', color: '#6B21A8', fontFamily: 'var(--font-body)', margin: 0, lineHeight: 1.5 }}>
              We&rsquo;re so sorry for your loss. We&rsquo;ll match {isSelf && !data.preferred_name ? 'you' : subjectThey} with a
              compassionate buddy within 48 hours, and a navigator will be in touch personally.
            </p>
            <div>
              <label htmlFor="grief_loss_type" style={{ ...labelStyle, display: 'block', marginBottom: '8px' }}>
                {isSelf && !data.preferred_name ? 'Who did you lose?' : `Who did ${subjectThey} lose?`} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span>
              </label>
              <select
                id="grief_loss_type"
                value={data.grief_loss_type}
                onChange={(e) => onChange('grief_loss_type', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">Prefer not to say</option>
                <option value="partner_spouse">Partner or spouse</option>
                <option value="parent">Parent</option>
                <option value="sibling">Sibling</option>
                <option value="close_friend">Close friend</option>
                <option value="other">Someone else</option>
              </select>
              <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', margin: '6px 0 0' }}>
                This just helps us make the grief circle invitation feel personal.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
