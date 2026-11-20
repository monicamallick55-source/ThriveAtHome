import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CITY_PAGES } from '@/lib/content/cities'

export async function generateStaticParams() {
  const states = [...new Set(CITY_PAGES.map((c: any) => c.stateCode.toLowerCase()))]
  return states.map((state: any) => ({ state }))
}

export default async function StatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params
  const stateCode = state.toUpperCase()
  const cities = CITY_PAGES.filter(c => c.stateCode === stateCode)
  if (!cities.length) notFound()

  const stateName = cities[0].state

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/directory" className="text-sm text-teal-600 hover:underline">← All States</Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">{stateName} Senior Services</h1>
        <p className="text-gray-600 mt-2">{cities.length} cities with local senior resources</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cities.map((city: any) => (
          <Link
            key={city.slug}
            href={`/directory/${state}/${city.slug}`}
            className="group border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-teal-300 transition-all"
          >
            <h2 className="font-semibold text-gray-900 group-hover:text-teal-700 mb-1">{city.city}</h2>
            <div className="text-sm text-gray-500">
              {city.seniorPct} seniors · {city.population} residents
            </div>
            <div className="mt-3 text-sm font-medium text-teal-600 group-hover:text-teal-800">View local resources →</div>
          </Link>
        ))}
      </div>
    </main>
  )
}
