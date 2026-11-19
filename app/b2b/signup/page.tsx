'use client'
import { useState } from 'react'

const ORG_TYPES = [
  {value:'village_network',label:'🏘️ Village Network'},
  {value:'area_agency_on_aging',label:'🏛️ Area Agency on Aging'},
  {value:'senior_center',label:'🏢 Senior Center'},
  {value:'faith_organization',label:'⛪ Faith Organization'},
  {value:'employer',label:'💼 Employer'},
  {value:'healthcare_system',label:'🏥 Healthcare System'},
  {value:'health_plan',label:'💊 Health Plan / Medicare Advantage'},
  {value:'agency',label:'🤝 Home Care Agency'},
  {value:'university',label:'🎓 University / College'},
  {value:'foundation',label:'🌱 Foundation / Nonprofit'},
]

export default function B2BSignupPage() {
  const [step,setStep]=useState<'form'|'submitting'|'success'|'error'>('form')
  const [orgId,setOrgId]=useState('')
  const [err,setErr]=useState('')
  const [form,setForm]=useState({org_name:'',org_type:'village_network',admin_email:'',seat_count:'25',plan:'basics'})
  const set=(k:keyof typeof form)=>(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>setForm(p=>({...p,[k]:e.target.value}))

  async function submit(e:React.FormEvent){
    e.preventDefault(); setStep('submitting')
    try{
      const r=await fetch('/api/b2b-signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,seat_count:Number(form.seat_count)})})
      const d=await r.json()
      if(!r.ok) throw new Error(d.error||'Signup failed')
      setOrgId(d.org_id||d.id||'new'); setStep('success')
    }catch(e:any){setErr(e.message||'Something went wrong'); setStep('error')}
  }

  const inp:React.CSSProperties={width:'100%',padding:'12px 14px',borderRadius:'10px',border:'1.5px solid #e5e7eb',fontSize:'1rem',boxSizing:'border-box',fontFamily:'system-ui,sans-serif'}
  const lbl:React.CSSProperties={display:'block',fontWeight:600,color:'#374151',marginBottom:'6px',fontSize:'0.9rem'}

  if(step==='success') return(
    <main style={{fontFamily:'system-ui,sans-serif',minHeight:'80vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 24px'}}>
      <div style={{textAlign:'center',maxWidth:'480px'}}>
        <div style={{fontSize:'4rem',marginBottom:'20px'}}>🎉</div>
        <h1 style={{fontSize:'1.75rem',fontWeight:800,color:'#111827',marginBottom:'12px'}}>Your organization is live!</h1>
        <p style={{color:'#6b7280',fontSize:'1rem',lineHeight:1.6,marginBottom:'8px'}}>Your account is ready. Continue to your onboarding wizard.</p>
        <p style={{color:'#9ca3af',fontSize:'0.85rem',marginBottom:'32px'}}>Org ID: <code style={{background:'#f3f4f6',padding:'2px 6px',borderRadius:'4px'}}>{orgId}</code></p>
        <a href="/b2b/onboarding" style={{display:'inline-block',background:'#6366f1',color:'#fff',padding:'14px 32px',borderRadius:'12px',fontWeight:700,fontSize:'1rem',textDecoration:'none'}}>Continue to onboarding →</a>
      </div>
    </main>
  )

  return(
    <main style={{fontFamily:'system-ui,sans-serif',minHeight:'80vh',background:'#f9fafb',padding:'64px 24px'}}>
      <div style={{maxWidth:'540px',margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:'36px'}}>
          <div style={{display:'inline-block',background:'#ede9fe',color:'#6366f1',padding:'5px 16px',borderRadius:'20px',fontSize:'0.75rem',fontWeight:700,marginBottom:'14px',textTransform:'uppercase',letterSpacing:'0.07em'}}>Organization Sign Up</div>
          <h1 style={{fontSize:'1.8rem',fontWeight:800,color:'#111827',marginBottom:'8px'}}>Launch your organization</h1>
          <p style={{color:'#6b7280',fontSize:'0.95rem'}}>Free to start · No credit card required</p>
        </div>
        <form onSubmit={submit} style={{background:'#fff',borderRadius:'20px',padding:'36px',border:'1px solid #e5e7eb'}}>
          {step==='error'&&<div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'10px',padding:'12px 16px',color:'#dc2626',fontSize:'0.9rem',marginBottom:'20px'}}>{err}</div>}
          <div style={{display:'flex',flexDirection:'column',gap:'18px'}}>
            <div><label style={lbl}>Organization Name *</label><input required value={form.org_name} onChange={set('org_name')} placeholder="e.g. Foster City Village" style={inp}/></div>
            <div><label style={lbl}>Organization Type *</label><select value={form.org_type} onChange={set('org_type')} style={inp}>{ORG_TYPES.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div><label style={lbl}>Admin Email *</label><input required type="email" value={form.admin_email} onChange={set('admin_email')} placeholder="you@org.com" style={inp}/></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
              <div><label style={lbl}>Expected Members</label><input type="number" min="1" value={form.seat_count} onChange={set('seat_count')} style={inp}/></div>
              <div><label style={lbl}>Plan</label><select value={form.plan} onChange={set('plan')} style={inp}><option value="basics">Starter (Free)</option><option value="b2b_standard">Village Pro ($4/member)</option><option value="b2b_premium">Enterprise</option></select></div>
            </div>
          </div>
          <button type="submit" disabled={step==='submitting'} style={{marginTop:'28px',width:'100%',padding:'14px',background:step==='submitting'?'#a5b4fc':'#6366f1',color:'#fff',border:'none',borderRadius:'12px',fontWeight:700,fontSize:'1rem',cursor:step==='submitting'?'default':'pointer',fontFamily:'system-ui,sans-serif'}}>
            {step==='submitting'?'Creating your organization…':'Create my organization →'}
          </button>
        </form>
        <p style={{textAlign:'center',marginTop:'20px',color:'#6b7280',fontSize:'0.875rem'}}>
          Questions? <a href="mailto:orgs@thriveathome.app" style={{color:'#6366f1'}}>Email us</a> · <a href="/for-organizations" style={{color:'#6366f1'}}>Learn more</a>
        </p>
      </div>
    </main>
  )
}
