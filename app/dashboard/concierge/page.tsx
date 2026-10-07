import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ConciergeRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawRequests } = await supabase
    .from('concierge_requests' as any)
    .select('id, title, request_type, status, preferred_date, created_at')
    .order('created_at', { ascending: false })

  const requests = (rawRequests as any[] | null) ?? []

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Concierge Requests</h1>
        <a href="/dashboard/concierge/new" className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700">
          New Request
        </a>
      </div>
      <ul className="space-y-3">
        {requests.map((r: any) => (
          <li key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{r.title}</p>
                <p className="text-sm text-gray-400 capitalize mt-0.5">{r.request_type.replace(/_/g, " ")}</p>
              </div>
              <span className={"text-xs px-2 py-1 rounded-full font-medium " + (
                r.status === "completed" ? "bg-green-100 text-green-700" :
                r.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                r.status === "cancelled" ? "bg-gray-100 text-gray-500" :
                "bg-yellow-100 text-yellow-700"
              )}>
                {r.status.replace(/_/g, " ")}
              </span>
            </div>
          </li>
        ))}
        {requests.length === 0 && (
          <li className="text-center text-gray-400 py-12">No requests yet.</li>
        )}
      </ul>
    </div>
  )
}
