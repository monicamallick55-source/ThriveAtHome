import Link from 'next/link'
import { LEGAL_DOCUMENTS, LEGAL_GUIDES } from '@/lib/content/legal'

export const metadata = {
  title: 'Legal Planning | ThriveAtHome',
  description: 'Track your essential legal documents and get plain-language guides on estate planning.',
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-50 border-red-300 text-red-800',
  high: 'bg-orange-50 border-orange-300 text-orange-800',
  medium: 'bg-yellow-50 border-yellow-300 text-yellow-800',
}

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Critical',
  high: 'High Priority',
  medium: 'Recommended',
}

export default function LegalPlanningPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Legal Planning Hub</h1>
        <p className="text-gray-600">Essential documents every senior should have — and plain-language guides to understand them.</p>
      </div>

      {/* Document Tracker */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Legal Document Checklist</h2>
        <div className="space-y-3">
          {LEGAL_DOCUMENTS.map((doc: any) => (
            <div key={doc.key} className={`border rounded-xl p-4 ${PRIORITY_COLORS[doc.priority] ?? 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    aria-label={`Mark ${doc.title} as complete`}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">{doc.description}</p>
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[doc.priority]}`}>
                    {PRIORITY_LABELS[doc.priority]}
                  </span>
                  {doc.guideUrl && (
                    <a
                      href={doc.guideUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal-600 hover:text-teal-800 font-medium"
                    >
                      Learn more →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Navigator CTA */}
      <section className="bg-teal-50 border border-teal-200 rounded-xl p-6 mb-10 flex items-start gap-4">
        <span className="text-2xl">⚖️</span>
        <div className="flex-1">
          <h2 className="font-semibold text-teal-900 mb-1">Need help getting started?</h2>
          <p className="text-sm text-teal-800">Our Care Navigators can refer you to elder law attorneys and help you understand your options — at no cost.</p>
        </div>
        <Link
          href="/dashboard"
          className="shrink-0 bg-teal-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
        >
          Talk to a Navigator
        </Link>
      </section>

      {/* Legal Guides */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Plain-Language Legal Guides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {LEGAL_GUIDES.map((guide: any) => (
            <div key={guide.slug} className="border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-2">{guide.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{guide.summary}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Read guide</span>
                <a
                  href={`/resources/legal-planning`}
                  className="text-sm font-medium text-teal-600 hover:text-teal-800"
                >
                  Read guide →
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
