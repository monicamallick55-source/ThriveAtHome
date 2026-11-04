'use client'
import { useState, useEffect, useCallback } from 'react'
type Festival = { id:string;name:string;date:string;time_start:string|null;time_end:string|null;location:string|null;address:string|null;culture:string|null;description:string|null;image_url:string|null;is_free:boolean;ticket_price:string|null;rsvp_limit:number|null;is_attending:boolean }
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December']
const CC: Record<string,{bg:string;color:string}> = {Chinese:{bg:'#fee2e2',color:'#991b1b'},Indian:{bg:'#fef3c7',color:'#92400e'},Mexican:{bg:'#d1fae5',color:'#065f46'},Japanese:{bg:'#fce7f3',color:'#be185d'},African:{bg:'#ede9fe',color:'#6d28d9'},Filipino:{bg:'#dbeafe',color:'#1e40af'},Korean:{bg:'#e0f2fe',color:'#075985'},Vietnamese:{bg:'#d1fae5',color:'#065f46'},Jewish:{bg:'#fefce8',color:'#854d0e'},Irish:{bg:'#dcfce7',color:'#166534'},Italian:{bg:'#fff7ed',color:'#9a3412'},Greek:{bg:'#eff6ff',color:'#1e3a8a'}}
function cs(c:string|null){return c&&CC[c]?CC[c]:{bg:'#f3f4f6',color:'#374151'}}
export default function FestivalsPage() {
  const now=new Date()
  const [year,setYear]=useState(now.getFullYear())
  const [month,setMonth]=useState(now.getMonth())
  const [festivals,setFestivals]=useState<Festival[]>([])
  const [cultures,setCultures]=useState<string[]>([])
  const [fc,setFc]=useState('all')
  const [view,setView]=useState<'calendar'|'list'|'my-events'>('calendar')
  const [loading,setLoading]=useState(true)
  const [rsvping,setRsvping]=useState<string|null>(null)
  const [toast,setToast]=useState<string|null>(null)
  const [myR,setMyR]=useState<any[]>([])
  const ms=year+'-'+String(month+1).padStart(2,'0')
  const load=useCallback(async()=>{setLoading(true);try{const p=new URLSearchParams({month:ms});if(fc!=='all')p.set('culture',fc);const d=await fetch('/api/festivals?'+p).then(r=>r.json());setFestivals(d.festivals??[]);setCultures(d.cultures??[])}finally{setLoading(false)}},[ms,fc])
  useEffect(()=>{load()},[load])
  useEffect(()=>{if(view==='my-events')fetch('/api/festivals?my_rsvp=true').then(r=>r.json()).then(d=>setMyR(d.rsvps??[]))},[view])
  function t3(m:string){setToast(m);setTimeout(()=>setToast(null),3500)}
  async function toggleR(f:Festival){setRsvping(f.id);try{const r=await fetch('/api/festivals/'+f.id+'/rsvp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:f.is_attending?'cancel':'rsvp'})});if(!r.ok){t3('Error: '+(await r.json()).error);return}t3(f.is_attending?'RSVP cancelled':"You're going!");setFestivals(p=>p.map(x=>x.id===f.id?{...x,is_attending:!f.is_attending}:x))}finally{setRsvping(null)}}
  function prev(){if(month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1)}
  function next(){if(month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1)}
  const dim=new Date(year,month+1,0).getDate()
  const fd=new Date(year,month,1).getDay()
  const grp: Record<string,Festival[]>={}
  festivals.forEach(f=>{grp[f.date]=grp[f.date]??[];grp[f.date].push(f)})
  const FC=({f,compact=false}:{f:Festival;compact?:boolean})=>{const c=cs(f.culture);return(
    <div style={{border:'1px solid #e5e7eb',borderRadius:compact?10:14,padding:compact?'12px 14px':'16px 18px',background:'#fff',display:'flex',gap:compact?10:12,alignItems:compact?'center':undefined}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:4}}>
          {f.culture&&<span style={{fontSize:'0.7rem',background:c.bg,color:c.color,padding:'1px 8px',borderRadius:99,fontWeight:700}}>{f.culture}</span>}
          {f.is_free?<span style={{fontSize:'0.7rem',background:'#d1fae5',color:'#065f46',padding:'1px 8px',borderRadius:99,fontWeight:700}}>Free</span>:f.ticket_price?<span style={{fontSize:'0.7rem',color:'#6b7280'}}>{"\u{1F4B0}"} {f.ticket_price}</span>:null}
        </div>
        <div style={{fontWeight:700,fontSize:compact?'0.88rem':'0.95rem',color:'#1f2937'}}>{f.name}</div>
        <div style={{fontSize:'0.78rem',color:'#6b7280',marginTop:3}}>{"\u{1F4C5}"} {new Date(f.date+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}{f.time_start?' · '+f.time_start:''}</div>
        {f.location&&<div style={{fontSize:'0.78rem',color:'#6b7280',marginTop:1}}>{"\u{1F4CD}"} {f.location}</div>}
        {!compact&&f.description&&<p style={{fontSize:'0.82rem',color:'#374151',marginTop:8,lineHeight:1.5}}>{f.description}</p>}
      </div>
      <div style={{flexShrink:0}}><button onClick={()=>toggleR(f)} disabled={rsvping===f.id} style={{padding:compact?'5px 12px':'7px 16px',background:f.is_attending?'#d1fae5':'#6366f1',color:f.is_attending?'#065f46':'#fff',border:f.is_attending?'1px solid #6ee7b7':'none',borderRadius:8,fontWeight:700,fontSize:'0.78rem',cursor:rsvping===f.id?'default':'pointer',whiteSpace:'nowrap'}}>{rsvping===f.id?'...':f.is_attending?'Going':'RSVP'}</button></div>
    </div>
  )}
  return (
    <div style={{maxWidth:820,margin:'0 auto',padding:'24px 16px',fontFamily:'system-ui,sans-serif'}}>
      {toast&&<div style={{position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',background:'#1f2937',color:'#fff',padding:'10px 24px',borderRadius:10,fontSize:'0.9rem',zIndex:100,whiteSpace:'nowrap'}}>{toast}</div>}
      <h1 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:4}}>Cultural Festival Calendar</h1>
      <p style={{color:'#6b7280',fontSize:'0.9rem',marginBottom:24}}>Celebrate traditions from around the world.</p>
      <div style={{display:'flex',borderBottom:'2px solid #e5e7eb',marginBottom:20}}>
        {(['calendar','list','my-events'] as const).map(v=><button key={v} onClick={()=>setView(v)} style={{padding:'7px 16px',background:'none',border:'none',borderBottom:view===v?'2px solid #6366f1':'2px solid transparent',marginBottom:-2,fontWeight:view===v?700:500,color:view===v?'#6366f1':'#6b7280',fontSize:'0.875rem',cursor:'pointer',whiteSpace:'nowrap'}}>{v==='calendar'?'Calendar':v==='list'?'List View':'My Events'}</button>)}
      </div>
      {view!=='my-events'&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12,marginBottom:16}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <button onClick={prev} style={{padding:'6px 12px',border:'1px solid #e5e7eb',borderRadius:8,background:'#fff',cursor:'pointer'}}>&#8249;</button>
          <span style={{fontWeight:700,fontSize:'1rem',minWidth:150,textAlign:'center'}}>{MONTHS[month]} {year}</span>
          <button onClick={next} style={{padding:'6px 12px',border:'1px solid #e5e7eb',borderRadius:8,background:'#fff',cursor:'pointer'}}>&#8250;</button>
        </div>
        {cultures.length>0&&<div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{['all',...cultures].map(c=><button key={c} onClick={()=>setFc(c)} style={{padding:'3px 10px',borderRadius:99,border:'1px solid '+(fc===c?'#6366f1':'#e5e7eb'),background:fc===c?'#6366f1':'#fff',color:fc===c?'#fff':'#374151',fontSize:'0.72rem',fontWeight:600,cursor:'pointer'}}>{c==='all'?'All Cultures':c}</button>)}</div>}
      </div>}
      {view==='calendar'&&<div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:4}}>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d} style={{textAlign:'center',fontSize:'0.72rem',fontWeight:700,color:'#9ca3af',padding:'4px 0'}}>{d}</div>)}</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2}}>
          {Array.from({length:fd}).map((_,i)=><div key={'b'+i} style={{minHeight:80}}/>)}
          {Array.from({length:dim}).map((_,i)=>{const day=i+1;const ds=year+'-'+String(month+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');const df=grp[ds]??[];const isToday=ds===now.toISOString().slice(0,10);return(
            <div key={day} style={{minHeight:80,border:'1px solid',borderColor:isToday?'#c4b5fd':'#f3f4f6',borderRadius:8,padding:'5px 6px',background:isToday?'#faf5ff':'#fff'}}>
              <div style={{fontSize:'0.78rem',fontWeight:isToday?800:500,color:isToday?'#7c3aed':'#374151',marginBottom:3}}>{day}</div>
              {df.map(f=>{const c=cs(f.culture);return <div key={f.id} title={f.name} style={{fontSize:'0.65rem',background:c.bg,color:c.color,borderRadius:4,padding:'1px 5px',marginBottom:2,fontWeight:600,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{f.name}</div>})}
            </div>
          )})}
        </div>
        {!loading&&festivals.length>0&&<div style={{marginTop:24}}><h3 style={{fontWeight:700,fontSize:'0.95rem',marginBottom:14}}>Events this month</h3><div style={{display:'flex',flexDirection:'column',gap:8}}>{festivals.map(f=><FC key={f.id} f={f} compact/>)}</div></div>}
      </div>}
      {view==='list'&&(loading?<div style={{textAlign:'center',padding:48,color:'#9ca3af'}}>Loading...</div>:festivals.length===0?<div style={{textAlign:'center',padding:48,color:'#9ca3af'}}>No festivals this month</div>:
        <div>{Object.entries(grp).sort().map(([date,df])=><div key={date} style={{marginBottom:20}}><div style={{fontSize:'0.85rem',fontWeight:700,color:'#6366f1',marginBottom:10,paddingBottom:4,borderBottom:'1px solid #e5e7eb'}}>{new Date(date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</div><div style={{display:'flex',flexDirection:'column',gap:10}}>{df.map(f=><FC key={f.id} f={f}/>)}</div></div>)}</div>
      )}
      {view==='my-events'&&(myR.length===0?<div style={{textAlign:'center',padding:48,color:'#9ca3af'}}><div style={{fontSize:'2.5rem',marginBottom:12}}>&#127775;</div><div style={{fontWeight:600,color:'#6b7280',marginBottom:8}}>No RSVPs yet</div><button onClick={()=>setView('list')} style={{padding:'8px 20px',background:'#6366f1',color:'#fff',border:'none',borderRadius:9,fontWeight:700,cursor:'pointer'}}>Browse Festivals</button></div>:
        <div style={{display:'flex',flexDirection:'column',gap:10}}>{myR.map((r:any)=>{const f=r.festival;if(!f)return null;const c=cs(f.culture);return(<div key={r.id} style={{border:'1px solid #e5e7eb',borderRadius:12,padding:'14px 16px',background:'#fff',borderLeft:'4px solid #6366f1'}}><div style={{fontWeight:700,fontSize:'0.95rem',color:'#1f2937'}}>{f.name}</div><div style={{display:'flex',gap:8,marginTop:6,alignItems:'center',flexWrap:'wrap'}}>{f.culture&&<span style={{fontSize:'0.7rem',background:c.bg,color:c.color,padding:'1px 8px',borderRadius:99,fontWeight:700}}>{f.culture}</span>}<span style={{fontSize:'0.78rem',color:'#6b7280'}}>{new Date(f.date+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</span>{f.location&&<span style={{fontSize:'0.78rem',color:'#6b7280'}}>{f.location}</span>}</div><span style={{display:'inline-block',marginTop:8,fontSize:'0.72rem',background:'#d1fae5',color:'#065f46',padding:'1px 8px',borderRadius:99,fontWeight:700}}>Going</span></div>)})}</div>
      )}
      <div style={{marginTop:24,padding:'14px 18px',background:'#f9fafb',borderRadius:12,border:'1px solid #e5e7eb',fontSize:'0.8rem',color:'#6b7280'}}>Know of a festival? Contact your navigator to have it added to the calendar.</div>
    </div>
  )
}
