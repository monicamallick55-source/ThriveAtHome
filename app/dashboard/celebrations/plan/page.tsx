'use client'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

// TC-F006 fix: family role explicitly allowed
const ALLOWED_ROLES = ['member','family','navigator','admin','platform_admin']
type PlanTier = 'digital'|'enhanced'|'premier'

export default function CelebrationPlannerPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [tier, setTier] = useState<PlanTier|null>(null)
  const [occasion, setOccasion] = useState('')
  const [date, setDate] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [allowed, setAllowed] = useState<boolean|null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({data:{user}}) => {
      if (!user) { router.push('/login'); return }
      const {data:m} = await supabase.from('members').select('role').eq('supabase_auth_id',user.id).maybeSingle()
      setAllowed(ALLOWED_ROLES.includes(m?.role??'member'))
    })
  },[])

  if (allowed===null) return <div className="p-8 text-center">Loading...</div>
  if (!allowed) return <div className="p-8 text-center text-red-600">Access denied</div>

  const tiers = [
    {id:'digital' as PlanTier,label:'Digital',price:'$0',desc:'Virtual celebration with community wishes'},
    {id:'enhanced' as PlanTier,label:'Enhanced',price:'$25',desc:'Gift basket + family video call'},
    {id:'premier' as PlanTier,label:'Premier',price:'$75',desc:'Full celebration with memory book'},
  ]

  async function confirm() {
    setLoading(true)
    try {
      const {data:{user}} = await supabase.auth.getUser()
      const {data:m} = await supabase.from('members').select('id').eq('supabase_auth_id',user!.id).maybeSingle()
      await supabase.from('celebration_plans').insert({member_id:m?.id,tier,occasion,celebration_date:date,title:title||null,status:'planned',created_at:new Date().toISOString()})
      router.push('/dashboard/celebrations?planned=1')
    } catch(e:any) { setError(e.message) }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto p-6" data-testid="celebration-planner">
      <h1 className="text-2xl font-bold mb-2">Plan a Celebration</h1>
      <div className="flex gap-2 mb-6">{[1,2,3].map(n=><div key={n} className={`flex-1 h-1.5 rounded ${step>=n?'bg-blue-500':'bg-gray-200'}`}/>)}</div>
      {step===1&&<div data-testid="step-1-tiers">
        <h2 className="text-lg font-semibold mb-4">Choose a tier</h2>
        {tiers.map(t=><button key={t.id} data-testid={`tier-${t.id}`} onClick={()=>{setTier(t.id);setStep(2)}}
          className={`w-full p-4 rounded-lg border-2 text-left mb-2 ${tier===t.id?'border-blue-500 bg-blue-50':'border-gray-200'}`}>
          <strong>{t.label}</strong> <span className="text-blue-600">{t.price}</span>
          <div className="text-sm text-gray-600">{t.desc}</div>
        </button>)}
      </div>}
      {step===2&&<div data-testid="step-2-details">
        <h2 className="text-lg font-semibold mb-4">Details</h2>
        <label className="block text-sm font-medium mb-1">Occasion *</label>
        <input data-testid="occasion-input" className="w-full border rounded p-2 mb-3" value={occasion} onChange={e=>setOccasion(e.target.value)} placeholder="Birthday, Anniversary..." />
        <label className="block text-sm font-medium mb-1">Date *</label>
        <input data-testid="date-input" type="date" className="w-full border rounded p-2 mb-3" value={date} onChange={e=>setDate(e.target.value)} />
        <label className="block text-sm font-medium mb-1">Title (optional)</label>
        <input data-testid="title-input" className="w-full border rounded p-2" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Mom's 80th!" />
        <div className="flex gap-3 mt-4">
          <button onClick={()=>setStep(1)} className="flex-1 py-2 border rounded">Back</button>
          <button onClick={()=>{if(occasion&&date)setStep(3)}} disabled={!occasion||!date} className="flex-1 py-2 bg-blue-500 text-white rounded disabled:opacity-50">Next</button>
        </div>
      </div>}
      {step===3&&<div data-testid="step-3-review">
        <h2 className="text-lg font-semibold mb-4">Review & Confirm</h2>
        <div className="bg-gray-50 rounded p-4 text-sm space-y-1">
          <div><strong>Tier:</strong> {tier}</div><div><strong>Occasion:</strong> {occasion}</div>
          <div><strong>Date:</strong> {date}</div>{title&&<div><strong>Title:</strong> {title}</div>}
        </div>
        {error&&<div className="mt-2 text-red-600 text-sm">{error}</div>}
        <div className="flex gap-3 mt-4">
          <button onClick={()=>setStep(2)} className="flex-1 py-2 border rounded">Back</button>
          <button onClick={confirm} disabled={loading} data-testid="confirm-btn" className="flex-1 py-2 bg-green-500 text-white rounded disabled:opacity-50">{loading?'Saving...':'Confirm'}</button>
        </div>
      </div>}
    </div>
  )
}
