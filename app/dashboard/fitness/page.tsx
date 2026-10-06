import { EXERCISE_LIBRARY, getExercisesForRiskLevel } from '@/lib/content/exercises'

export const metadata = {
  title: 'Senior Fitness | ThriveAtHome',
  description: 'Personalized exercises for balance, strength, cardio, and flexibility.',
}

const CATEGORY_COLORS: Record<string, string> = {
  balance: 'bg-blue-50 border-blue-200 text-blue-800',
  strength: 'bg-orange-50 border-orange-200 text-orange-800',
  cardio: 'bg-red-50 border-red-200 text-red-800',
  flexibility: 'bg-green-50 border-green-200 text-green-800',
}

const CATEGORY_ICONS: Record<string, string> = {
  balance: '⚖️',
  strength: '💪',
  cardio: '❤️',
  flexibility: '🧘',
}

export default function FitnessPage() {
  const allExercises = EXERCISE_LIBRARY

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Senior Fitness Hub</h1>
        <p className="text-gray-600">Safe, effective exercises designed for adults 65+ — no gym required.</p>
      </div>

      {/* PT Referral Banner */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 mb-8 flex items-start gap-4">
        <span className="text-2xl">🏥</span>
        <div className="flex-1">
          <h2 className="font-semibold text-teal-900 mb-1">Want a physical therapist evaluation?</h2>
          <p className="text-sm text-teal-800">Our Care Navigators can connect you with a licensed PT for a personalized plan.</p>
        </div>
        <a
          href="/dashboard"
          className="shrink-0 bg-teal-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
        >
          Request PT Referral
        </a>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {['balance', 'strength', 'cardio', 'flexibility'].map((cat) => {
          const exercises = allExercises.filter((e) => e.category === cat)
          return (
            <div key={cat} className={`border rounded-xl p-4 text-center ${CATEGORY_COLORS[cat]}`}>
              <div className="text-2xl mb-1">{CATEGORY_ICONS[cat]}</div>
              <div className="font-semibold capitalize">{cat}</div>
              <div className="text-xs mt-1 opacity-75">{exercises.length} exercises</div>
            </div>
          )
        })}
      </div>

      {/* Exercise Library */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Exercise Library</h2>
      <div className="space-y-4">
        {allExercises.map((ex) => (
          <div key={ex.key} className="border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{ex.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${CATEGORY_COLORS[ex.category]}`}>
                    {CATEGORY_ICONS[ex.category]} {ex.category}
                  </span>
                  <span className="text-xs text-gray-500">{ex.durationMinutes} min</span>
                  {ex.reps && <span className="text-xs text-gray-500">{ex.reps} reps × {ex.sets} sets</span>}
                </div>
              </div>
              <div className="text-xs text-gray-400 shrink-0">
                Risk: {ex.fallRiskLevels.join(', ')}
              </div>
            </div>
            <ol className="space-y-1">
              {ex.instructions.map((step, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-teal-600 font-medium shrink-0">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <button className="text-sm font-medium text-teal-600 hover:text-teal-800 transition-colors">
                + Log this exercise
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Log CTA */}
      <div className="mt-10 bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
        <h2 className="font-semibold text-gray-900 mb-2">Track Your Progress</h2>
        <p className="text-sm text-gray-600 mb-4">Log your workouts to build healthy habits and share progress with your care team.</p>
        <a
          href="/dashboard"
          className="inline-block bg-teal-600 text-white text-sm font-medium px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
        >
          View My Fitness Log
        </a>
      </div>
    </main>
  )
}
