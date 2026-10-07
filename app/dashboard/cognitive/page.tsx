import Link from 'next/link'

export const metadata = {
  title: 'Brain Health | ThriveAtHome',
  description: 'Daily brain activities, memory care resources, and cognitive wellness tools.',
}

const BRAIN_ACTIVITIES = [
  {
    key: 'word_recall',
    name: 'Word Recall Challenge',
    description: 'Read a list of 10 words, then recall as many as possible after a short delay.',
    icon: '🔤',
    durationMinutes: 5,
    category: 'memory',
  },
  {
    key: 'pattern_match',
    name: 'Pattern Matching',
    description: 'Identify which shapes match and which are different in a grid of visual patterns.',
    icon: '🔷',
    durationMinutes: 5,
    category: 'attention',
  },
  {
    key: 'story_recall',
    name: 'Story Recall',
    description: 'Listen to a short story, then answer questions about what you heard.',
    icon: '📖',
    durationMinutes: 8,
    category: 'memory',
  },
  {
    key: 'number_sequence',
    name: 'Number Sequences',
    description: 'Complete number sequences and simple arithmetic problems to keep your mind sharp.',
    icon: '🔢',
    durationMinutes: 5,
    category: 'reasoning',
  },
  {
    key: 'word_finding',
    name: 'Word Finding',
    description: 'Name as many items in a category (e.g., animals, fruits) as you can in 60 seconds.',
    icon: '💬',
    durationMinutes: 3,
    category: 'language',
  },
]

const CATEGORY_COLORS: Record<string, string> = {
  memory: 'bg-purple-50 text-purple-700 border-purple-200',
  attention: 'bg-blue-50 text-blue-700 border-blue-200',
  reasoning: 'bg-orange-50 text-orange-700 border-orange-200',
  language: 'bg-green-50 text-green-700 border-green-200',
}

export default function CognitivePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Brain Health Hub</h1>
        <p className="text-gray-600">Daily activities to support memory, attention, and cognitive wellness.</p>
      </div>

      {/* Daily Activities */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Brain Activities</h2>
        <div className="space-y-4">
          {BRAIN_ACTIVITIES.map((activity: any) => (
            <div key={activity.key} className="border border-gray-200 rounded-xl p-5 flex items-center gap-4">
              <div className="text-3xl shrink-0">{activity.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{activity.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${CATEGORY_COLORS[activity.category]}`}>
                    {activity.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">{activity.durationMinutes} min</p>
              </div>
              <button className="shrink-0 bg-teal-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">
                Start
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Memory Care Resources */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Memory Care Resources</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-2">Understanding Memory Changes</h3>
            <p className="text-sm text-gray-600 mb-3">Learn which memory changes are normal aging vs. signs to discuss with a doctor.</p>
            <Link href="/resources/daily-living" className="text-sm font-medium text-teal-600 hover:text-teal-800">Read guide →</Link>
          </div>
          <div className="border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-2">Dementia Caregiver Support</h3>
            <p className="text-sm text-gray-600 mb-3">Resources for families supporting a loved one with memory concerns.</p>
            <Link href="/for-families" className="text-sm font-medium text-teal-600 hover:text-teal-800">Family resources →</Link>
          </div>
          <div className="border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-2">Wandering Prevention Plan</h3>
            <p className="text-sm text-gray-600 mb-3">Safety planning tools and local resources for families concerned about wandering.</p>
            <Link href="/dashboard" className="text-sm font-medium text-teal-600 hover:text-teal-800">Talk to a Navigator →</Link>
          </div>
          <div className="border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-2">Brain-Healthy Lifestyle</h3>
            <p className="text-sm text-gray-600 mb-3">Sleep, exercise, nutrition, and social connection — all proven to support brain health.</p>
            <Link href="/resources/senior-fitness" className="text-sm font-medium text-teal-600 hover:text-teal-800">Explore fitness →</Link>
          </div>
        </div>
      </section>

      {/* Navigator CTA */}
      <section className="bg-purple-50 border border-purple-200 rounded-xl p-6 flex items-start gap-4">
        <span className="text-2xl">🧠</span>
        <div className="flex-1">
          <h2 className="font-semibold text-purple-900 mb-1">Have memory concerns?</h2>
          <p className="text-sm text-purple-800">Our Care Navigators can connect you with memory care specialists and local support groups.</p>
        </div>
        <Link
          href="/dashboard"
          className="shrink-0 bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Talk to a Navigator
        </Link>
      </section>
    </main>
  )
}
