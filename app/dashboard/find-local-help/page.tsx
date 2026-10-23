import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
export const metadata = { title: 'Find Local Help — ThriveAtHome' }
const CATS=[{icon:'🏠',label:'Home Safety & Modifications',q:'aging in place contractor home modification'},{icon:'🍽️',label:'Meal Delivery',q:'meal delivery senior nutrition'},{icon:'🚗',label:'Transportation',q:'senior transportation non-emergency medical transport'},{icon:'🤝',label:'In-Home Care',q:'home health aide personal care companion'},{icon:'⚕️',label:'Medical & Health',q:'geriatric doctor primary care senior health'},{icon:'⚖️',label:'Legal & Financial',q:'elder law attorney senior financial planning'},{icon:'🧠',label:'Mental Health',q:'senior therapist counseling mental health'},{icon:'🏡',label:'Adult Day Programs',q:'adult day program senior center'},{icon:'🔧',label:'Handyman Services',q:'handyman senior home repair'},{icon:'📦',label:'Moving & Downsizing',q:'senior move manager downsizing estate sale'},{icon:'🐾',label:'Pet Care',q:'pet care dog walking senior pet services'},{icon:'🌿',label:'Yard & Home Maintenance',q:'lawn care snow removal housekeeping senior'}]
const FREE=[{name:'Eldercare Locator',url:'https://eldercare.acl.gov',desc:'Official US government tool — find any senior service by zip code',badge:'Federal'},{name:'BenefitsCheckUp',url:'https://www.benefitscheckup.org',desc:'Find benefits programs you qualify for — 2,500+ programs',badge:'NCOA'},{name:'AARP Local Resources',url:'https://local.aarp.org',desc:'Community resources, events, and services near you',badge:'AARP'},{name:'Area Agency on Aging',url:'https://eldercare.acl.gov/Public/About/Aging_Network/AAA.aspx',desc:'Local experts funded by your tax dollars — free guidance',badge:'Local'},{name:'Find a CAPS Specialist',url:'https://www.nahb.org/caps',desc:'Certified Aging in Place Specialists — vetted contractors',badge:'NAHB'},{name:'Medicare Service Locator',url:'https://www.medicare.gov/care-compare/',desc:'Compare home health agencies, nursing homes, and hospitals',badge:'Medicare'}]
export default async function FindLocalHelpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('members').select('zip_code, city, state').eq('supabase_auth_id', user.id).maybeSingle()
  const location = profile?.city && profile?.state ? `${profile.city}, ${profile.state}` : profile?.zip_code || ''
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Find Local Help</h1>
        <p className="text-gray-500 mt-1">Search for local senior care services{location ? ` near ${location}` : ' in your area'}.</p>
      </div>
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 mb-8 flex items-start gap-4">
        <div className="text-2xl flex-shrink-0">🧭</div>
        <div className="flex-1">
          <p className="font-semibold text-teal-900 text-[15px]">Your navigator can find and book services for you</p>
          <p className="text-teal-700 text-[14px] mt-1">Message your ThriveAtHome navigator — they maintain vetted local referral lists and can arrange things faster.</p>
        </div>
        <a href="/dashboard/messages" className="flex-shrink-0 bg-teal-600 text-white text-[14px] font-semibold px-4 py-2 rounded-lg hover:bg-teal-700 whitespace-nowrap">Message navigator</a>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Browse by category</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
        {CATS.map(cat=>(
          <a key={cat.label} href={`https://www.google.com/search?q=${encodeURIComponent(`${cat.q} near ${location||'me'}`)}`} target="_blank" rel="noopener noreferrer"
            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-teal-400 hover:shadow-md transition-all group">
            <div className="text-2xl mb-2">{cat.icon}</div>
            <div className="font-semibold text-gray-900 text-[14px] group-hover:text-teal-700 leading-tight">{cat.label}</div>
          </a>
        ))}
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Free national resource locators</h2>
      <div className="flex flex-col gap-3 mb-10">
        {FREE.map(r=>(
          <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer" className="bg-white border border-gray-200 rounded-xl p-4 hover:border-teal-400 hover:shadow-md transition-all flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900 text-[15px]">{r.name}</span>
                <span className="bg-gray-100 text-gray-600 text-[11px] font-semibold px-2 py-0.5 rounded-full">{r.badge}</span>
              </div>
              <p className="text-gray-500 text-[13px]">{r.desc}</p>
            </div>
            <span className="text-teal-600 font-semibold text-[14px] flex-shrink-0">Visit →</span>
          </a>
        ))}
      </div>
      <div className="bg-[#1e3a5f] rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">Not sure what you need?</h3>
        <p className="text-white/80 text-[14px] mb-4">Our free checklists walk through home safety, caregiver needs, legal planning, and more.</p>
        <a href="/checklists" className="inline-block bg-[#0d9488] text-white font-semibold px-5 py-2.5 rounded-lg text-[14px]">Browse checklists & guides →</a>
      </div>
    </div>
  )
}
