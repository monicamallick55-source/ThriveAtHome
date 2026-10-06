'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BURNOUT_QUESTIONS, scoreBurnout, CAREGIVER_GUIDES } from '@/lib/content/caregiver'

export default function ForFamiliesPage() {
  const [answers, setAnswers] = useState<boolean[]>(new Array(BURNOUT_QUESTIONS.length).fill(false))
  const [result, setResult] = useState<ReturnType<typeof scoreBurnout> | null>(null)

  function toggle(i: number) {
    const next = [...answers]
    next[i] = !next[i]
    setAnswers(next)
  }

  function runAssessment() {
    setResult(scoreBurnout(answers))
  }

  const LEVEL_COLORS = {
    low: 'bg-green-50 border-green-300 text-green-800',
    moderate: 'bg-yellow-50 border-yellow-300 text-yellow-800',
    high: 'bg-red-50 border-red-300 text-red-800',
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">For Families & Caregivers</h1>
        <p className="text-gray-600">Resources, tools, and support for those caring for an aging loved one.</p>
      </div>

      {/* Burnout Assessment */}
      <section className="border border-gray-200 rounded-xl p-6 mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Caregiver Strain Assessment</h2>
        <p className="text-sm text-gray-500 mb-6">
          The Caregiver Strain Index helps identify stress before it becomes burnout. Takes about 2 minutes.
        </p>
        <div className="space-y-3 mb-6">
          {BURNOUT_QUESTIONS.map((q, i) => (
            <label key={i} className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={answers[i]}
                onChange={() => toggle(i)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">{q}</span>
            </label>
          ))}
        </div>
        <button
          onClick={runAssessment}
          className="bg-teal-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-teal-700 transition-colors"
        >
          See My Results
        </button>

        {result && (
          <div className={`mt-5 border rounded-xl p-5 ${LEVEL_COLORS[result.level]}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">
                Score: {result.score}/10 — {result.level === 'low' ? 'Low Strain' : result.level === 'moderate' ? 'Moderate Strain' : 'High Strain'}
              </h3>
            </div>
            <p className="text-sm mb-3">{result.message}</p>
            {result.resources.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2">Recommended resources:</p>
                <ul className="space-y-1">
                  {result.resources.map((r, i) => (
                    <li key={i} className="text-sm">• {r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Caregiver Guides */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Caregiver Guides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CAREGIVER_GUIDES.map((guide) => (
            <div key={guide.slug} className="border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-2">{guide.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{guide.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{guide.readTimeMinutes} min read</span>
                <Link
                  href={`/resources/caregiver-support`}
                  className="text-sm font-medium text-teal-600 hover:text-teal-800"
                >
                  Read guide →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Support CTA */}
      <section className="bg-teal-50 border border-teal-200 rounded-xl p-6 flex items-start gap-4">
        <span className="text-2xl">🤝</span>
        <div className="flex-1">
          <h2 className="font-semibold text-teal-900 mb-1">You don't have to do this alone</h2>
          <p className="text-sm text-teal-800">
            Our Care Navigators support the whole family — from finding respite care to navigating memory care options.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="shrink-0 bg-teal-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
        >
          Get Support
        </Link>
      </section>
    </main>
  )
}
