// app/navigator/volunteers/page.tsx
// Staff volunteer admin page — VSO affiliation overview + VAVS export

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VavsExportPanel from '@/components/volunteers/VavsExportPanel'

export default async function VolunteersAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: isStaff } = await supabase.rpc('is_staff')
  if (!isStaff) redirect('/dashboard')

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Volunteer Administration</h1>
        <p className="text-gray-500 mt-1">
          Manage volunteer service hours, VSO affiliations, and VAVS reporting.
        </p>
      </div>

      <div className="space-y-6">
        <VavsExportPanel />

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">VSO Affiliations</h2>
          <p className="text-sm text-gray-500 mb-4">
            Volunteers with a VSO affiliation (VFW, American Legion, DAV, AMVETS, MOAA, USO)
            are tracked separately for VAVS reporting purposes.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { key: 'vfw', label: 'VFW', color: 'bg-red-50 border-red-200 text-red-800' },
              { key: 'american_legion', label: 'American Legion', color: 'bg-blue-50 border-blue-200 text-blue-800' },
              { key: 'dav', label: 'DAV', color: 'bg-green-50 border-green-200 text-green-800' },
              { key: 'amvets', label: 'AMVETS', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
              { key: 'moaa', label: 'MOAA', color: 'bg-purple-50 border-purple-200 text-purple-800' },
              { key: 'uso', label: 'USO', color: 'bg-orange-50 border-orange-200 text-orange-800' },
            ].map(vso => (
              <div key={vso.key} className={`rounded-lg border px-3 py-2 text-sm font-medium ${vso.color}`}>
                {vso.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
