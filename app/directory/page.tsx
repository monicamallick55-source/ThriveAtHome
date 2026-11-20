import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DIRECTORY_CATEGORIES } from '@/lib/content/directory-categories'

export const metadata = {
  title: 'Local Senior Services Directory | ThriveAtHome',
  description: 'Find trusted local services for seniors — home care, transportation, meal delivery, home modification, and more. Search by location and service type.',
}

export const revalidate = 3600

interface SearchParams { q?: string; category?: string; state?: string }

export default async function DirectoryPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()
  const q = searchParams.q?.trim() ?? ''
  const category = searchParams.category ?? ''
  const state = searchParams.state ?? ''

  let query = supabase
    .from('partner_listings')
    .select('id, name, slug, bio, category, city, state, phone, website, logo_url, verified, featured')
    .eq('verified', true)
    .order('featured', { ascending: false })
    .order('name')
    .limit(60)

  if (category) query = query.eq('category', category)
  if (state) query = query.eq('state', state.toUpperCase())
  if (q) query = query.ilike('name', `%${q}%`)

  const { data: listings } = await query

  const categoryObj = DIRECTORY_CATEGORIES.find(c => c.slug === category)

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Local Senior Services Directory</h1>
        <p className="text-gray-600">Find trusted local providers across 60 service categories — vetted and reviewed by the ThriveAtHome community.</p>
      </div>

      {/* Search + filters */}
      <form method="GET" className="bg-white border border-gray-200 rounded-xl p-5 mb-8 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or keyword…"
          className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <select
          name="category"
          defaultValue={category}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All categories</option>
          {DIRECTORY_CATEGORIES.map(c => (
            <option key={c.slug} value={c.slug}>{c.icon} {c.label}</option>
          ))}
        </select>
        <select
          name="state"
          defaultValue={state}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All states</option>
          {['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-teal-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          Search
        </button>
        {(q || category || state) && (
          <Link href="/directory" className="text-sm text-gray-500 hover:text-gray-700 self-center">Clear</Link>
        )}
      </form>

      {/* Category chips — show when no filter active */}
      {!category && !q && !state && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Browse by category</h2>
          <div className="flex flex-wrap gap-2">
            {DIRECTORY_CATEGORIES.map(c => (
              <Link
                key={c.slug}
                href={`/directory?category=${c.slug}`}
                className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-700 text-sm px-3 py-1.5 rounded-full hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition-colors"
              >
                <span>{c.icon}</span> {c.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Active filter label */}
      {(category || q || state) && (
        <div className="mb-4 text-sm text-gray-600">
          {listings?.length ?? 0} result{listings?.length !== 1 ? 's' : ''}
          {categoryObj ? ` for ${categoryObj.icon} ${categoryObj.label}` : ''}
          {state ? ` in ${state}` : ''}
          {q ? ` matching "${q}"` : ''}
        </div>
      )}

      {/* Listings grid */}
      {listings && listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {listings.map(p => {
            const cat = DIRECTORY_CATEGORIES.find(c => c.slug === p.category)
            return (
              <Link
                key={p.id}
                href={`/directory/${p.slug}`}
                className="border border-gray-200 rounded-xl p-5 hover:border-teal-300 hover:shadow-md transition-all group bg-white"
              >
                <div className="flex items-start gap-3 mb-3">
                  {p.logo_url ? (
                    <img src={p.logo_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center text-2xl flex-shrink-0">
                      {cat?.icon ?? '🏠'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 group-hover:text-teal-700 leading-tight">{p.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{cat?.label ?? p.category}</p>
                  </div>
                  {p.featured && (
                    <span className="ml-auto text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">Featured</span>
                  )}
                </div>
                {p.bio && <p className="text-sm text-gray-600 line-clamp-2 mb-3">{p.bio}</p>}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {p.city && p.state && <span>📍 {p.city}, {p.state}</span>}
                  {p.phone && <span>· {p.phone}</span>}
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-xl mb-12">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-700 font-medium mb-1">No listings found</p>
          <p className="text-gray-500 text-sm mb-4">Try a different category or search term.</p>
          <Link href="/directory" className="text-teal-600 text-sm hover:underline">Clear filters →</Link>
        </div>
      )}

      {/* Partner CTA */}
      <section className="bg-navy-50 border border-navy-100 rounded-xl p-8 text-center" style={{background:'#f0f4f9', borderColor:'#c5d3e0'}}>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Are you a service provider?</h2>
        <p className="text-gray-600 mb-5 text-sm max-w-lg mx-auto">Join thousands of trusted providers on ThriveAtHome. Get discovered by seniors and families in your area looking for exactly what you offer.</p>
        <Link
          href="/directory/submit"
          className="inline-block bg-teal-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors"
        >
          List your business free →
        </Link>
      </section>
    </main>
  )
}
