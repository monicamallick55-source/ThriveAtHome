import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { STATES, getStateByAbbr } from '@/lib/content/states'
export const metadata = { title: 'Senior Resources by State — ThriveAtHome', description: 'Find Medicaid waivers, Area Agencies on Aging, legal aid, and senior programs in your state.' }
const US_STATES_LIST:[string,string][]=[['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming']]
function abbrToSlug(abbr:string){return STATES.find(s=>s.abbr===abbr)?.slug??abbr.toLowerCase()}
export default async function StatesHubPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let memberState:string|null=null,memberStateName:string|null=null,memberStateSlug:string|null=null
  if (user) {
    const { data: profile } = await supabase.from('members').select('state').eq('supabase_auth_id', user.id).maybeSingle()
    if (profile?.state) {
      const abbr = profile.state.length===2 ? profile.state.toUpperCase() : null
      const sd = abbr ? getStateByAbbr(abbr) : STATES.find(s=>s.name.toLowerCase()===profile.state.toLowerCase())
      if (sd) { memberState=sd.abbr; memberStateName=sd.name; memberStateSlug=sd.slug }
    }
  }
  return (
    <div className="min-h-screen bg-[#fafaf5]">
      <div className="bg-[#1e3a5f] text-white py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block bg-[#0d9488] text-white text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4">Free Resources</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Senior Resources by State</h1>
          <p className="text-white/75 text-lg max-w-xl">Medicaid waivers, Area Agencies on Aging, legal aid, food assistance — organized by state.</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-10">
        {memberStateName && memberStateSlug && (
          <div className="mb-10">
            <div className="text-[13px] font-semibold text-teal-700 uppercase tracking-wider mb-3">📍 Your State</div>
            <Link href={`/resources/states/${memberStateSlug}`} className="block bg-white border-2 border-teal-400 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[12px] text-teal-600 font-semibold uppercase tracking-wider mb-1">{memberState}</div>
                  <h2 className="text-2xl font-bold text-[#1e3a5f] group-hover:text-teal-700">{memberStateName}</h2>
                  <p className="text-gray-500 text-[14px] mt-1">View Medicaid waivers, AAA contacts, legal aid, and more</p>
                </div>
                <div className="text-3xl opacity-60 ml-4">→</div>
              </div>
            </Link>
          </div>
        )}
        <h2 className="text-xl font-bold text-gray-900 mb-4">Browse all states</h2>
        <input type="text" placeholder="Type a state name to filter…" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[15px] mb-6 focus:outline-none focus:ring-2 focus:ring-teal-500"
          onInput={(e)=>{const v=(e.target as HTMLInputElement).value.toLowerCase();document.querySelectorAll<HTMLElement>('[data-scard]').forEach(el=>{el.style.display=(el.dataset.sname??'').toLowerCase().includes(v)?'':'none'})}} />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {US_STATES_LIST.map(([abbr,name])=>(
            <Link key={abbr} href={`/resources/states/${abbrToSlug(abbr)}`} data-scard="" data-sname={name}
              className={`flex items-center gap-2 bg-white border rounded-xl px-4 py-3 text-[14px] font-semibold hover:border-teal-400 hover:shadow-sm transition-all ${abbr===memberState?'border-teal-300 text-teal-800 bg-teal-50':'border-gray-200 text-gray-800'}`}>
              <span className="text-gray-400 text-[12px] font-mono w-6">{abbr}</span>
              <span className="leading-snug">{name}</span>
              {abbr===memberState && <span className="ml-auto text-[10px]">📍</span>}
            </Link>
          ))}
        </div>
        <div className="mt-12 bg-[#1e3a5f] rounded-2xl p-7 text-white">
          <h3 className="text-lg font-bold mb-2">Want help navigating these programs?</h3>
          <p className="text-white/75 text-[14px] mb-5">ThriveAtHome navigators specialize in benefits enrollment — they know which programs your parent qualifies for.</p>
          <a href="/signup" className="inline-block bg-[#0d9488] text-white font-semibold px-5 py-2.5 rounded-lg text-[14px]">Get a navigator →</a>
        </div>
      </div>
    </div>
  )
}
