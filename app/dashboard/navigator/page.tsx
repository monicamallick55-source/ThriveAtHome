'use client'
export default function NavigatorPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Navigator</h1>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Care Navigator</h2>
          <p className="text-gray-600">Your navigator is here to guide you through Thrive@Home and connect you with the right resources.</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Tasks</h2>
          <div className="text-gray-400 text-sm py-4 text-center">No tasks assigned yet. Your navigator will add tasks here.</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Navigator Guide</h2>
          <p className="text-gray-600 text-sm">Your navigator will help you set goals, find services, and stay on track with your care plan.</p>
        </div>
      </div>
    </main>
  )
}
