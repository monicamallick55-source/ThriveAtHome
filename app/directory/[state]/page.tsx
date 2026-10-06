import Link from 'next/link'
import { getCitiesByState, CITY_PAGES } from '@/lib/content/cities'

export function generateStaticParams() {
  return CITY_PAGES.map((c) => ({ state: c.stateCode.toLowerCase() }))
    .filter((v, i, arr) => arr.findIndex((x) => x.state === v.state) === i)
}

export async function generateMetadata({ params }: { params: { state: string } }) {
  const stateName = CITY_PAGES.find((c) => c.stateCode.toLowerCase() === params.state)?.state ?? params.state.toUpperCase()
  return {
    title: `Senior Services in ${stateName} | ThriveAtHome`,
    description: `Find local senior resources, home care, and independent living support across ${stateName}.`,
  }
}

export default function StatePage({ params }: { params: { state: string } }) {
  const cities = getCitiesByState(params.state.toUpperCase())
  const stateName = cities[0]?.state ?? params.state.toUpperCase()

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <Link href="/directory" className="text-sm text-teal-600 hover:text-teal-800 mb-6 inline-block">← All States</Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Senior Services in {stateName}</h1>
      <p className="text-gray-600 mb-8">Find local resources and care support in your city.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cities.map((city) => (
          <Link
            key={city.slug}
            href={`/directory/${params.state}/${city.slug}`}
            className="border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-teal-300 transition-all group"
          >
            <h2 className="font-semibold text-gray-900 group-hover:text-teal-700 mb-1">{city.city}</h2>
            <div className="text-sm text-gray-500">
              {(city.population * city.seniorPct / 100).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} seniors · {(city.seniorPct * 100).toFixed(0)}% 65+
            </div>
            <div className="mt-3 text-sm font-medium text-teal-600 group-hover:text-teal-800">View local resources →</div>
          </Link>
        ))}
      </div>
    </main>
  )
}
