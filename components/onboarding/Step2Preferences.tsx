'use client'
import type { OnboardingFormData } from './types'

interface Props {
  data: OnboardingFormData
  onChange: (field: keyof OnboardingFormData, value: string) => void
  errors: Partial<Record<keyof OnboardingFormData, string>>
}

const CALL_TIMES = [
  { value: 'morning', label: 'Morning', time: '8am – 10am', desc: 'A calm start to the day' },
  { value: 'mid_morning', label: 'Mid-morning', time: '10am – 12pm', desc: 'After breakfast routines' },
  { value: 'afternoon', label: 'Afternoon', time: '1pm – 3pm', desc: 'Post-lunch and settled' },
  { value: 'late_afternoon', label: 'Late afternoon', time: '3pm – 5pm', desc: 'Before evening activities' },
  { value: 'evening', label: 'Evening', time: '6pm – 8pm', desc: 'End of day reflection' },
]

const FREQUENCIES = [
  { value: 'daily', label: 'Daily', desc: 'A check-in every morning' },
  { value: 'every_other_day', label: 'Every other day', desc: 'Three to four times a week' },
  { value: 'weekly', label: 'Weekly', desc: 'Once a week on the same day' },
]

const TOPICS = [
  'Family', 'Gardening', 'Cooking', 'Music', 'Travel memories', 'Sports',
  'Books', 'Movies & TV', 'Faith & spirituality', 'History', 'Nature', 'Current events',
]

const labelStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-body)',
  marginBottom: '4px',
}

const hintStyle: React.CSSProperties = {
  fontSize: '15px',
  color: 'var(--color-text-muted)',
  fontFamily: 'var(--font-body)',
  margin: '0 0 16px',
}

export function Step2Preferences({ data, onChange }: Props) {
  const selectedTopics = data.topics_enjoy
    ? data.topics_enjoy.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  function toggleTopic(topic: string) {
    const current = new Set(selectedTopics)
    if (current.has(topic)) {
      current.delete(topic)
    } else {
      current.add(topic)
    }
    onChange('topics_enjoy', Array.from(current).join(', '))
  }

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
          How would they like Aria to reach out?
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '18px', margin: 0, fontFamily: 'var(--font-body)' }}>
          These settings help us make every call feel perfectly timed and personal.
        </p>
      </div>

      {/* Call time — radio cards */}
      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend style={labelStyle}>Preferred call time</legend>
        <p style={hintStyle}>When does {data.preferred_name || 'the senior'} like to have conversations?</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {CALL_TIMES.map((option) => {
            const isSelected = data.preferred_call_time === option.value
            return (
              <label
                key={option.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${isSelected ? 'var(--color-teal)' : 'var(--color-warm-grey)'}`,
                  backgroundColor: isSelected ? 'var(--color-teal-muted)' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minHeight: '56px',
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '18px',
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? 'var(--color-teal)' : 'var(--color-text-primary)',
                      margin: 0,
                    }}
                  >
                    {option.label} <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--color-text-muted)', fontWeight: 400 }}>· {option.time}</span>
                  </p>
                  <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', margin: '2px 0 0', fontFamily: 'var(--font-body)' }}>
                    {option.desc}
                  </p>
                </div>
                <input
                  type="radio"
                  name="preferred_call_time"
                  value={option.value}
                  checked={isSelected}
                  onChange={() => onChange('preferred_call_time', option.value)}
                  style={{
                    width: '20px',
                    height: '20px',
                    accentColor: 'var(--color-teal)',
                    flexShrink: 0,
                    marginLeft: '16px',
                  }}
                />
              </label>
            )
          })}
        </div>
      </fieldset>

      {/* Check-in frequency — radio cards */}
      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend style={labelStyle}>How often should Aria call?</legend>
        <p style={hintStyle}>You can change this at any time from the dashboard.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {FREQUENCIES.map((option) => {
            const isSelected = data.check_in_frequency === option.value
            return (
              <label
                key={option.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${isSelected ? 'var(--color-teal)' : 'var(--color-warm-grey)'}`,
                  backgroundColor: isSelected ? 'var(--color-teal-muted)' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minHeight: '56px',
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '18px',
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? 'var(--color-teal)' : 'var(--color-text-primary)',
                      margin: 0,
                    }}
                  >
                    {option.label}
                  </p>
                  <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', margin: '2px 0 0', fontFamily: 'var(--font-body)' }}>
                    {option.desc}
                  </p>
                </div>
                <input
                  type="radio"
                  name="check_in_frequency"
                  value={option.value}
                  checked={isSelected}
                  onChange={() => onChange('check_in_frequency', option.value as OnboardingFormData['check_in_frequency'])}
                  style={{
                    width: '20px',
                    height: '20px',
                    accentColor: 'var(--color-teal)',
                    flexShrink: 0,
                    marginLeft: '16px',
                  }}
                />
              </label>
            )
          })}
        </div>
      </fieldset>

      {/* Topics they enjoy — pill multi-select */}
      <div>
        <p style={labelStyle}>Topics {data.preferred_name || 'they'} enjoy talking about</p>
        <p style={hintStyle}>Select as many as you like — Aria will naturally bring these up.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {TOPICS.map((topic) => {
            const isSelected = selectedTopics.includes(topic)
            return (
              <button
                key={topic}
                type="button"
                onClick={() => toggleTopic(topic)}
                aria-pressed={isSelected}
                style={{
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-full)',
                  border: `1.5px solid ${isSelected ? 'var(--color-navy)' : 'var(--color-warm-grey)'}`,
                  backgroundColor: isSelected ? 'var(--color-navy)' : 'white',
                  color: isSelected ? 'var(--color-cream)' : 'var(--color-text-secondary)',
                  fontSize: '18px',
                  fontFamily: 'var(--font-body)',
                  fontWeight: isSelected ? 500 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minHeight: '44px',
                }}
              >
                {topic}
              </button>
            )
          })}
        </div>
      </div>

      {/* Topics to avoid */}
      <div>
        <label htmlFor="topics_avoid" style={labelStyle}>Topics to avoid</label>
        <p style={hintStyle}>We&apos;ll make sure Aria steers clear of these.</p>
        <textarea
          id="topics_avoid"
          value={data.topics_avoid}
          onChange={(e) => onChange('topics_avoid', e.target.value)}
          rows={3}
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
          placeholder="e.g. politics, health worries, recent news"
        />
      </div>
    </div>
  )
}
