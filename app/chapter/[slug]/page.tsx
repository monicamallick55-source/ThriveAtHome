export default function ChapterPage({ params }: { params: { slug: string } }) {
  const name = params.slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{name} Chapter</h1>
        <p className="text-gray-600 mb-8">Connect with Thrive@Home members and volunteers in the {name} area.</p>
        <div className="bg-gray-50 rounded-2xl p-8 text-center text-gray-400">
          <p>Chapter events and community posts coming soon.</p>
          <a href="/dashboard/communities" className="mt-4 inline-block text-blue-600 hover:underline text-sm">Browse all communities →</a>
        </div>
      </div>
    </main>
  )
}
