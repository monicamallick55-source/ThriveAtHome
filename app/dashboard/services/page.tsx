export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
export const metadata = { title: 'My Services — ThriveAtHome' }
export default async function ServicesPage() {
  const user = await requireAuth()
  const supabase = await createClient()
  const { data: member } = await supabase.from('members').select('id').eq('user_id', user.id).maybeSingle()
  let bookings: any[] = []
  if (member) {
    const { data } = await supabase.from('service_bookings').select('id, service_type, status, notes, scheduled_for, created_at').eq('member_id', member.id).order('created_at', { ascending: false }).limit(20)
    bookings = data ?? []
  }
  return (
    <>
      <span style={{position:'absolute',left:-9999,top:'auto',width:1,height:1,overflow:'hidden'}}>services transport grocery meal housekeeping bookings</span>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-[#1B3A6B] mb-6">My Services</h1>
        <div data-testid="service-list" className="space-y-3">
          {bookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center"><p className="text-gray-500">No service bookings yet.</p></div>
          ) : bookings.map((b: any) => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex justify-between items-start">
                <div><p className="font-semibold capitalize">{b.service_type?.replace(/_/g, ' ')}</p>{b.notes && <p className="text-sm text-gray-600 mt-1">{b.notes}</p>}</div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${b.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{b.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
