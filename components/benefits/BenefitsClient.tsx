'use client'

import { useState } from 'react'
import type { BenefitsAnswers, BenefitProgram } from '@/lib/benefits/data'
import { filterBenefits } from '@/lib/benefits/data'

const CATEGORY_LABELS: Record<string, string> = {
  health: '🏥 Health',
  food: '🥗 Food',
  housing: '🏠 Housing',
  income: '💵 Income',
  veteran: '🎖️ Veteran',
  utility: '💡 Utilities',
  social: '🤝 Community',
}

const CATEGORY_COLORS: Record<string, string> = {
  health: '#1E6B9E',
  food: '#2A8A5E',
  housing: '#D4880E',
  income: '#6A3D9A',
  veteran: '#E8401C',
  utility: '#C74B8A',
  social: '#1A7A6A',
}

type Step = 'q1' | 'q2' | 'q3' | 'q4' | 'results'

const INITIAL_ANSWERS: BenefitsAnswers = {
  income: 'under20k',
  age: '65-69',
  isVeteran: false,
  hasDisability: false,
}

export default function BenefitsClient() {
  const [step, setStep] = useState<Step>('q1')
  const [answers, setAnswers] = useState<BenefitsAnswers>(INITIAL_ANSWERS)
  const [results, setResults] = useState<BenefitProgram[]>([])

  function goNext() {
    if (step === 'q1') setStep('q2')
    else if (step === 'q2') setStep('q3')
    else if (step === 'q3') setStep('q4')
    else if (step === 'q4') {
      setResults(filterBenefits(answers))
      setStep('results')
    }
  }

  function restart() {
    setAnswers(INITIAL_ANSWERS)
    setStep('q1')
    setResults([])
  }

  const stepNum = step === 'q1' ? 1 : step === 'q2' ? 2 : step === 'q3' ? 3 : step === 'q4' ? 4 : 5
  const totalSteps = 4

  if (step === 'results') {
    return <ResultsView results={results} onRestart={restart} />
  }

  return (
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{
        background: 'white', borderRadius: '24px', padding: '48px',
        border: '1px solid var(--color-warm-grey)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        maxWidth: '560px', width: '100%',
      }}>
        {/* Progress */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Question {stepNum} of {totalSteps}
            </span>
          </div>
          <div style={{ height: '4px', background: 'var(--color-warm-grey)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: 'var(--color-navy)',
              width: `${(stepNum / totalSteps) * 100}%`,
              borderRadius: '2px', transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {step === 'q1' && (
          <Question
            question="What is your approximate annual household income?"
            options={[
              { value: 'under20k', label: 'Under $20,000' },
              { value: '20k-40k', label: '$20,000 – $40,000' },
              { value: '40k-60k', label: '$40,000 – $60,000' },
              { value: 'over60k', label: 'Over $60,000' },
            ]}
            selected={answers.income}
            onSelect={v => setAnswers(a => ({ ...a, income: v as BenefitsAnswers['income'] }))}
          />
        )}
        {step === 'q2' && (
          <Question
            question="What age range best describes the senior?"
            options={[
              { value: '60-64', label: '60 – 64' },
              { value: '65-69', label: '65 – 69' },
              { value: '70-74', label: '70 – 74' },
              { value: '75plus', label: '75 or older' },
            ]}
            selected={answers.age}
            onSelect={v => setAnswers(a => ({ ...a, age: v as BenefitsAnswers['age'] }))}
          />
        )}
        {step === 'q3' && (
          <YesNoQuestion
            question="Is the senior a U.S. military veteran?"
            selected={answers.isVeteran}
            onSelect={v => setAnswers(a => ({ ...a, isVeteran: v }))}
          />
        )}
        {step === 'q4' && (
          <YesNoQuestion
            question="Does the senior have a disability or chronic health condition that affects daily activities?"
            selected={answers.hasDisability}
            onSelect={v => setAnswers(a => ({ ...a, hasDisability: v }))}
          />
        )}

        <button
          onClick={goNext}
          style={{
            marginTop: '32px', width: '100%',
            backgroundColor: 'var(--color-navy)', color: 'white',
            border: 'none', borderRadius: '100px', padding: '16px',
            fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {step === 'q4' ? 'Find Benefits →' : 'Next →'}
        </button>
      </div>
    </div>
  )
}

function Question({
  question,
  options,
  selected,
  onSelect,
}: {
  question: string
  options: { value: string; label: string }[]
  selected: string
  onSelect: (v: string) => void
}) {
  return (
    <>
      <h2 style={{
        fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500,
        color: 'var(--color-navy)', marginBottom: '28px', lineHeight: 1.35,
      }}>
        {question}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {options.map((opt: any) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            style={{
              padding: '16px 20px', borderRadius: '12px', textAlign: 'left',
              border: selected === opt.value
                ? '2px solid var(--color-navy)'
                : '2px solid var(--color-warm-grey)',
              backgroundColor: selected === opt.value ? 'var(--color-navy)' : 'white',
              color: selected === opt.value ? 'white' : 'var(--color-navy)',
              fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </>
  )
}

function YesNoQuestion({
  question,
  selected,
  onSelect,
}: {
  question: string
  selected: boolean
  onSelect: (v: boolean) => void
}) {
  return (
    <>
      <h2 style={{
        fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500,
        color: 'var(--color-navy)', marginBottom: '28px', lineHeight: 1.35,
      }}>
        {question}
      </h2>
      <div style={{ display: 'flex', gap: '16px' }}>
        {([true, false] as const).map((v: any) => (
          <button
            key={String(v)}
            onClick={() => onSelect(v)}
            style={{
              flex: 1, padding: '20px', borderRadius: '12px', textAlign: 'center',
              border: selected === v
                ? '2px solid var(--color-navy)'
                : '2px solid var(--color-warm-grey)',
              backgroundColor: selected === v ? 'var(--color-navy)' : 'white',
              color: selected === v ? 'white' : 'var(--color-navy)',
              fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
          >
            {v ? 'Yes' : 'No'}
          </button>
        ))}
      </div>
    </>
  )
}

function ResultsView({ results, onRestart }: { results: BenefitProgram[]; onRestart: () => void }) {
  return (
    <div style={{ padding: '40px 24px 80px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500,
          color: 'var(--color-navy)', marginBottom: '12px',
        }}>
          {results.length > 0
            ? `${results.length} benefit${results.length !== 1 ? 's' : ''} may apply`
            : 'No matches found'}
        </h2>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '16px',
          color: 'var(--color-text-secondary)', lineHeight: 1.6,
        }}>
          Based on your answers, the programs below may be available. Eligibility varies by state and individual circumstances.
        </p>
      </div>

      {/* Disclaimer */}
      <div style={{
        background: '#FFF8E8', border: '1px solid #F0C040', borderRadius: '12px',
        padding: '16px 20px', marginBottom: '32px',
        display: 'flex', gap: '12px', alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>ℹ️</span>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '14px',
          color: '#7A5A00', lineHeight: 1.6, margin: 0,
        }}>
          <strong>This is a general guide.</strong> A navigator can help you determine exact eligibility and apply. Income limits and program details change — always verify with the official program.
        </p>
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 32px',
          background: 'white', borderRadius: '16px',
          border: '1px solid var(--color-warm-grey)',
        }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
            With higher income and no veteran status or disability, fewer needs-based programs apply — but our navigators can still help find local resources.
          </p>
          <a
            href="https://eldercare.acl.gov/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              backgroundColor: 'var(--color-navy)', color: 'white',
              padding: '14px 28px', borderRadius: '100px',
              fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Find Local Area Agency on Aging
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
          {results.map((b: any) => (
            <BenefitCard key={b.id} benefit={b} />
          ))}
        </div>
      )}

      {/* Restart */}
      <button
        onClick={onRestart}
        style={{
          background: 'transparent', border: '2px solid var(--color-navy)',
          color: 'var(--color-navy)', borderRadius: '100px', padding: '12px 28px',
          fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        ← Start over
      </button>
    </div>
  )
}

function BenefitCard({ benefit }: { benefit: BenefitProgram }) {
  const color = CATEGORY_COLORS[benefit.category] ?? '#1E6B9E'
  const label = CATEGORY_LABELS[benefit.category] ?? benefit.category
  return (
    <div style={{
      background: 'white', borderRadius: '16px', padding: '24px',
      border: '1px solid var(--color-warm-grey)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '10px' }}>
        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500,
          color: 'var(--color-navy)', margin: 0, lineHeight: 1.3,
        }}>
          {benefit.name}
        </h3>
        <span style={{
          flexShrink: 0,
          background: `${color}14`, color,
          fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em',
          padding: '4px 12px', borderRadius: '100px',
          fontFamily: 'var(--font-body)',
        }}>
          {label}
        </span>
      </div>
      <p style={{
        fontFamily: 'var(--font-body)', fontSize: '15px',
        color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '16px',
      }}>
        {benefit.summary}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600,
          color: '#2A8A5E',
        }}>
          {benefit.estimatedValue}
        </span>
        <a
          href={benefit.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            backgroundColor: color, color: 'white',
            padding: '9px 20px', borderRadius: '100px',
            fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600,
            textDecoration: 'none', flexShrink: 0,
          }}
        >
          Learn more →
        </a>
      </div>
    </div>
  )
}
