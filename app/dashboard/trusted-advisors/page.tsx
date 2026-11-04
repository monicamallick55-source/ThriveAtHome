'use client'
import { useState, useEffect } from 'react'
type Advisor = { id: string; name: string; role: string; specialty?: string; bio?: string; languages?: string[]; accepting_new: boolean; contact_via_navigator: boolean; photo_url?: string; virtual_available: boolean; in_person_available: boolean }
const ROLE_LABELS: Record<string, string> = { therapist:'🧠 Therapist', grief_counselor:'💛 Grief Counselor', chaplain:'✝️ Chaplain / Spiritual Care', social_worker:'🤝 Social Worker', life_coach:'🌱 Life Coach', financial_advisor:'📊 Financial Advisor', legal_advisor:'⚖️ Legal Aid', care_coordinator:'🏥 Care Coordinator', other:'👤 Advisor' }
const ROLE_FILTERS = [{ value:'',label:'All'},{ value:'therapist',label:'Therapists'},{ value:'grief_counselor',label:'Grief Counselors'},{ value:'chaplain',label:'Chaplains'},{ value:'social_worker',label:'Social Workers'},{ value:'financial_advisor',label:'Financial Advisors'},{ value:'legal_advisor',label:'Legal Aid'}]
export default function TrustedAdvisorsPage() {
  const [advisors,setAdvisors]=useState<Advisor[]>([])
  const [loading,setLoading]=useState(true)
  const [filterRole,setFilterRole]=useState('')
  const [filterVirtual,setFilterVirtual]=useState(false)
  const [requesting,setRequesting]=useState<string|null>(null)
  const [toast,setToast]=useState<{msg:string;warn?:boolean}|null>(null)
  useEffect(()=>{loadAdvisors()},[])
  async function loadAdvisors(){setLoading(true);try{const res=await fetch('/api/trusted-advisors');const data=await res.json();setAdvisors(data.advisors??[])}catch{setAdvisors([])}finally{setLoading(false)}}
  function showToast(msg:string,warn=false){setToast({msg,warn});setTimeout(()=>setToast(null),4000)}
  async function requestIntro(advisorId:string){setRequesting(advisorId);try{const res=await fetch('/api/trusted-advisors/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({advisor_id:advisorId})});const data=await res.json();if(!res.ok){showToast(data.error??'Could not send request',true);return}showToast('✅ Your navigator will reach out to arrange an introduction!')}finally{setRequesting(null)}}
  const filtered=advisors.filter(a=>{if(filterRole&&a.role!==filterRole)return false;if(filterVirtual&&!a.virtual_available)return false;return true})
  return (
    <div style={{maxWidth:740,margin:'0 auto',padding:'24px 16px',fontFamily:'system-ui, sans-serif'}}>
      {toast&&<div style={{position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',background:toast.warn?'#92400e':'#1f2937',color:'#fff',padding:'10px 24px',borderRadius:10,fontSize:'0.9rem',zIndex:100,boxShadow:'0 4px 16px rgba(0,0,0,0.2)',maxWidth:420,textAlign:'center'}}>{toast.msg}</div>}
      <h1 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:4}}>Trusted Advisors</h1>
      <p style={{color:'#6b7280',marginBottom:24,fontSize:'0.9rem'}}>Therapists, chaplains, grief counselors, and more — vetted by our care team. Your navigator will facilitate every introduction.</p>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20,alignItems:'center'}}>
        {ROLE_FILTERS.map(f=>(
          <button key={f.value} onClick={()=>setFilterRole(f.value)} style={{padding:'5px 14px',borderRadius:99,border:`1px solid ${filterRole===f.value?'#6366f1':'#e5e7eb'}`,background:filterRole===f.value?'#6366f1':'#fff',color:filterRole===f.value?'#fff':'#374151',fontSize:'0.8rem',fontWeight:600,cursor:'pointer'}}>{f.label}</button>
        ))}
        <button onClick={()=>setFilterVirtual(v=>!v)} style={{padding:'5px 14px',borderRadius:99,marginLeft:'auto',border:`1px solid ${filterVirtual?'#10b981':'#e5e7eb'}`,background:filterVirtual?'#d1fae5':'#fff',color:filterVirtual?'#065f46':'#6b7280',fontSize:'0.8rem',fontWeight:600,cursor:'pointer'}}>📱 Virtual only</button>
      </div>
      {loading?(<p style={{color:'#9ca3af',textAlign:'center',paddingTop:40}}>Loading advisors…</p>)
      :filtered.length===0?(<div style={{textAlign:'center',paddingTop:48,color:'#9ca3af'}}><div style={{fontSize:'2.5rem',marginBottom:12}}>🔍</div><p>No advisors in this category right now.</p><p style={{fontSize:'0.82rem',marginTop:8}}>Your navigator can help connect you even if someone isn't listed here.</p></div>)
      :(<div style={{display:'flex',flexDirection:'column',gap:16}}>
          {filtered.map(advisor=>(
            <div key={advisor.id} style={{border:'1px solid #e5e7eb',borderRadius:16,padding:'20px',background:'#fff',display:'flex',gap:18,alignItems:'flex-start',flexWrap:'wrap'}}>
              <div style={{width:56,height:56,borderRadius:'50%',flexShrink:0,background:'#ede9fe',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.6rem',overflow:'hidden'}}>
                {advisor.photo_url?<img src={advisor.photo_url} alt={advisor.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:'👤'}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:8}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:'1rem',color:'#1f2937'}}>{advisor.name}</div>
                    <div style={{fontSize:'0.82rem',color:'#6b7280',marginTop:2}}>{ROLE_LABELS[advisor.role]??advisor.role}{advisor.specialty?` · ${advisor.specialty}`:''}</div>
                  </div>
                  {!advisor.accepting_new&&<span style={{fontSize:'0.72rem',background:'#fee2e2',color:'#991b1b',padding:'2px 10px',borderRadius:99,fontWeight:700,flexShrink:0}}>Waitlist</span>}
                </div>
                {advisor.bio&&<p style={{fontSize:'0.84rem',color:'#374151',marginTop:10,lineHeight:1.5}}>{advisor.bio}</p>}
                <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:12}}>
                  {advisor.virtual_available&&<span style={{fontSize:'0.75rem',background:'#ede9fe',color:'#5b21b6',padding:'3px 10px',borderRadius:99,fontWeight:600}}>📱 Virtual</span>}
                  {advisor.in_person_available&&<span style={{fontSize:'0.75rem',background:'#dbeafe',color:'#1e40af',padding:'3px 10px',borderRadius:99,fontWeight:600}}>🏠 In-Person</span>}
                  {advisor.languages&&advisor.languages.filter(l=>l!=='English').map(lang=><span key={lang} style={{fontSize:'0.75rem',background:'#f0fdf4',color:'#065f46',padding:'3px 10px',borderRadius:99,fontWeight:600}}>🌐 {lang}</span>)}
                </div>
                <button onClick={()=>requestIntro(advisor.id)} disabled={requesting===advisor.id||!advisor.accepting_new} style={{marginTop:14,padding:'8px 20px',border:'none',borderRadius:8,background:!advisor.accepting_new?'#e5e7eb':requesting===advisor.id?'#e5e7eb':'#6366f1',color:!advisor.accepting_new?'#9ca3af':requesting===advisor.id?'#9ca3af':'#fff',fontWeight:700,fontSize:'0.85rem',cursor:!advisor.accepting_new||requesting===advisor.id?'default':'pointer'}}>
                  {requesting===advisor.id?'Requesting…':!advisor.accepting_new?'Join Waitlist':'Request Introduction'}
                </button>
              </div>
            </div>
          ))}
        </div>)}
      <div style={{marginTop:32,padding:'16px 20px',background:'#f9fafb',borderRadius:12,border:'1px solid #e5e7eb',fontSize:'0.82rem',color:'#6b7280'}}>
        <strong style={{color:'#374151'}}>How it works:</strong> When you request an introduction, your navigator reaches out to the advisor on your behalf and coordinates a first call or meeting — at no cost to you.
      </div>
    </div>
  )
}
