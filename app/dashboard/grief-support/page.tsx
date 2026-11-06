'use client'
import { useState } from 'react'

const PATHWAYS = [
  {
    id: 'loss',
    title: 'Loss of a Loved One',
    description: 'Losing someone you love is one of life\'s most difficult experiences. Find compassionate support for grief and healing.',
    icon: '🕊️',
  },
  {
    id: 'diagnosis',
    title: 'Major Health Diagnosis',
    description: 'Receiving a serious health diagnosis can be overwhelming. Connect with others who understand what you\'re facing.',
    icon: '🏥',
  },
  {
    id: 'life-change',
    title: 'Major Life Change',
    description: 'Life transitions — retirement, moving, losing independence — bring grief too. Support is here for every kind of loss.',
    icon: '🌱',
  },
  {
    id: 'caregiver',
    title: 'Caregiver Support',
    description: 'Caring for a loved one is both meaningful and exhausting. Find support for caregiver burnout and emotional wellbeing.',
    icon: '🤝',
  },
  {
    id: 'divorce',
    title: 'Divorce & Separation',
    description: 'The end of a long relationship brings profound grief. Compassionate support for navigating this painful transition.',
    icon: '💔',
  },
  {
    id: 'driving',
    title: 'Loss of Driving & Independence',
    description: 'Giving up driving or losing independence is a significant loss. We help you navigate this transition with dignity.',
    icon: '🚗',
  },
  {
    id: 'dementia',
    title: 'Dementia & MCI Diagnosis',
    description: 'A dementia or MCI diagnosis changes everything. Support for members and families navigating cognitive changes.',
    icon: '🧠',
  },
  {
    id: 'housing',
    title: 'Housing Insecurity & Forced Move',
    description: 'Facing housing insecurity or a forced move is deeply stressful. Find resources and emotional support here.',
    icon: '🏠',
  },
  {
    id: 'adult-child',
    title: 'Adult Child Moving Away',
    description: 'When an adult child moves away, the distance can feel profound. Connect with others who understand this transition.',
    icon: '👨‍👩‍👦',
  },
]

export default function GriefSupportPage() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Grief & Life Transitions Support</h1>
      <p className="text-gray-600 mb-8">
        Every loss deserves acknowledgment. Choose your pathway to find tailored resources and community support.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PATHWAYS.map(pathway => (
          <button
            key={pathway.id}
            onClick={() => setSelected(selected === pathway.id ? null : pathway.id)}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              selected === pathway.id
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
            }`}
          >
            <div className="text-2xl mb-2">{pathway.icon}</div>
            <h3 className="font-semibold text-gray-900 mb-1">{pathway.title}</h3>
            <p className="text-sm text-gray-600">{pathway.description}</p>
            {selected === pathway.id && (
              <div className="mt-3 pt-3 border-t border-purple-200">
                <a
                  href={`/dashboard/grief-support/${pathway.id}`}
                  className="text-purple-600 font-medium text-sm hover:underline"
                >
                  Connect with navigator →
                </a>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
