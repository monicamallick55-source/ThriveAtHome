export default function ResourcePage({ params }: { params: { slug: string } }) {
  const name = params.slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{name}</h1>
        <p className="text-gray-600 mb-8">Thrive@Home resources to help you live confidently and independently at home.</p>
        <div className="bg-gray-50 rounded-2xl p-8 text-center text-gray-400">
          <p>Content for this resource is being prepared. Check back soon.</p>
          <a href="/dashboard" className="mt-4 inline-block text-blue-600 hover:underline text-sm">Go to your dashboard →</a>
        </div>
      </div>
    </main>
  )
}
