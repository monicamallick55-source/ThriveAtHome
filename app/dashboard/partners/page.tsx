import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function PartnersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawPartners } = await supabase
    .from('local_partners' as any)
    .select('id, name, category, description, phone, website, city, state, discount_description, is_featured')
    .order('name')

  const partners = (rawPartners as any[] | null) ?? []
  const categories = [...new Set(partners.map((p: any) => p.category as string))].sort()

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Local Partner Directory</h1>
      <p className="text-gray-500 mb-6">Trusted services and discounts for Thrive members.</p>
      {categories.map(cat => (
        <div key={cat} className="mb-8">
          <h2 className="text-lg font-semibold text-indigo-700 capitalize mb-3">{cat.replace(/_/g, " ")}</h2>
          <ul className="space-y-3">
            {partners.filter((p: any) => p.category === cat).map((p: any) => (
              <li key={p.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{p.name}</p>
                    {p.description && <p className="text-sm text-gray-500 mt-0.5">{p.description}</p>}
                    {p.discount_description && (
                      <p className="text-sm text-green-700 font-medium mt-1">{p.discount_description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{[p.city, p.state].filter(Boolean).join(", ")}</p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {p.phone && <a href={"tel:" + p.phone} className="text-xs text-indigo-600 hover:underline">{p.phone}</a>}
                    {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">Website</a>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {partners.length === 0 && (
        <p className="text-gray-400 text-center py-12">No partners listed yet.</p>
      )}
    </div>
  )
}
