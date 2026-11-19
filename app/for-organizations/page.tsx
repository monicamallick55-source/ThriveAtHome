import Link from 'next/link'

export default function ForOrgsPage() {
  return (
    <main style={{fontFamily:'system-ui,sans-serif'}}>
      <section style={{background:'linear-gradient(135deg,#1e1b4b,#312e81)',color:'#fff',padding:'96px 24px 80px',textAlign:'center'}}>
        <div style={{maxWidth:'720px',margin:'0 auto'}}>
          <div style={{display:'inline-block',background:'#3730a3',color:'#c7d2fe',padding:'5px 16px',borderRadius:'20px',fontSize:'0.75rem',fontWeight:700,marginBottom:'24px',textTransform:'uppercase',letterSpacing:'0.08em'}}>For Organizations</div>
          <h1 style={{fontSize:'clamp(1.8rem,5vw,2.75rem)',fontWeight:800,lineHeight:1.15,marginBottom:'20px'}}>
            Launch a senior village.<br/>Power a caregiver benefit.<br/>
            <span style={{color:'#818cf8'}}>All on one platform.</span>
          </h1>
          <p style={{color:'#a5b4fc',fontSize:'1.05rem',maxWidth:'560px',margin:'0 auto 40px',lineHeight:1.65}}>
            Thrive@Home gives your organization a complete senior independence platform — Aria AI, community tools, care coordination, and your branded admin portal. Deploy in weeks.
          </p>
          <div style={{display:'flex',gap:'16px',justifyContent:'center',flexWrap:'wrap'}}>
            <Link href="/b2b/signup" style={{background:'#6366f1',color:'#fff',textDecoration:'none',padding:'14px 32px',borderRadius:'12px',fontWeight:700,fontSize:'1rem'}}>Start free →</Link>
            <a href="#plans" style={{background:'transparent',color:'#c7d2fe',textDecoration:'none',padding:'14px 32px',borderRadius:'12px',fontWeight:600,fontSize:'1rem',border:'2px solid #3730a3'}}>See plans</a>
          </div>
        </div>
      </section>

      <section style={{padding:'72px 24px',background:'#f9fafb'}}>
        <div style={{maxWidth:'960px',margin:'0 auto'}}>
          <h2 style={{textAlign:'center',fontSize:'1.6rem',fontWeight:700,color:'#111827',marginBottom:'40px'}}>Built for every senior-serving organization</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'20px'}}>
            {[
              {icon:'🏘️',label:'Village Networks',desc:'Launch a member-run senior village with platform, AI, and community tools.'},
              {icon:'🏢',label:'Employers',desc:'Add Thrive@Home as a caregiving benefit for employees with senior family members.'},
              {icon:'🏛️',label:'Area Agencies on Aging',desc:'Scale your reach with an AI-enhanced platform built for AAA workflows.'},
              {icon:'⛪',label:'Faith Organizations',desc:'Extend your congregation\'s care ministry with volunteer and check-in tools.'},
              {icon:'🏥',label:'Health Plans',desc:'Offer as a supplemental benefit to reduce isolation-driven utilization.'},
              {icon:'🌱',label:'Nonprofits & Foundations',desc:'Power subsidized senior access with grant-fundable infrastructure.'},
            ].map(o=>(
              <div key={o.label} style={{background:'#fff',borderRadius:'14px',padding:'24px',border:'1px solid #e5e7eb'}}>
                <div style={{fontSize:'1.75rem',marginBottom:'10px'}}>{o.icon}</div>
                <h3 style={{fontWeight:700,color:'#111827',marginBottom:'6px',fontSize:'0.95rem'}}>{o.label}</h3>
                <p style={{color:'#6b7280',fontSize:'0.875rem',lineHeight:1.6,margin:0}}>{o.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="plans" style={{padding:'72px 24px',background:'#fff'}}>
        <div style={{maxWidth:'900px',margin:'0 auto'}}>
          <h2 style={{textAlign:'center',fontSize:'1.6rem',fontWeight:700,color:'#111827',marginBottom:'8px'}}>Simple pricing</h2>
          <p style={{textAlign:'center',color:'#6b7280',marginBottom:'40px'}}>Start free. Scale as you grow.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'20px'}}>
            {[
              {name:'Starter',price:'Free',sub:'Up to 25 members',features:['Aria AI check-in calls','Community board','Org admin portal','Basic family dashboards'],cta:'Start free',href:'/b2b/signup?plan=basics',highlight:false},
              {name:'Village Pro',price:'$4',sub:'per member / month',features:['Everything in Starter','White-label branding','Volunteer matching','Fraud protection','Navigator coordination','Dedicated account manager'],cta:'Get started',href:'/b2b/signup?plan=b2b_standard',highlight:true},
              {name:'Enterprise',price:'Custom',sub:'Unlimited members',features:['Everything in Pro','SSO / SAML','Custom AI persona','API access','BAA available','99.9% SLA'],cta:'Contact us',href:'mailto:orgs@thriveathome.app',highlight:false},
            ].map(p=>(
              <div key={p.name} style={{background:'#fff',borderRadius:'18px',padding:'32px',border:p.highlight?'2px solid #6366f1':'2px solid #e5e7eb',position:'relative'}}>
                {p.highlight&&<div style={{position:'absolute',top:'-13px',left:'50%',transform:'translateX(-50%)',background:'#6366f1',color:'#fff',padding:'4px 16px',borderRadius:'20px',fontSize:'0.75rem',fontWeight:700,whiteSpace:'nowrap'}}>Most Popular</div>}
                <h3 style={{fontWeight:700,color:'#111827',marginBottom:'4px'}}>{p.name}</h3>
                <div style={{marginBottom:'4px'}}><span style={{fontSize:'2rem',fontWeight:800,color:'#111827'}}>{p.price}</span><span style={{color:'#9ca3af',fontSize:'0.8rem',marginLeft:'4px'}}>{p.sub}</span></div>
                <ul style={{listStyle:'none',padding:0,margin:'20px 0 24px',display:'flex',flexDirection:'column',gap:'8px'}}>
                  {p.features.map(f=><li key={f} style={{display:'flex',gap:'8px',fontSize:'0.875rem',color:'#374151'}}><span style={{color:'#10b981',fontWeight:700}}>✓</span>{f}</li>)}
                </ul>
                <a href={p.href} style={{display:'block',textAlign:'center',padding:'11px',borderRadius:'10px',fontWeight:700,fontSize:'0.9rem',textDecoration:'none',background:p.highlight?'#6366f1':'#f3f4f6',color:p.highlight?'#fff':'#374151'}}>{p.cta}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{padding:'72px 24px',textAlign:'center',background:'#f9fafb'}}>
        <h2 style={{fontSize:'1.75rem',fontWeight:700,color:'#111827',marginBottom:'12px'}}>Ready to launch?</h2>
        <p style={{color:'#6b7280',marginBottom:'28px'}}>Free to start. Set up in minutes.</p>
        <Link href="/b2b/signup" style={{display:'inline-block',background:'#6366f1',color:'#fff',padding:'14px 36px',borderRadius:'12px',fontWeight:700,fontSize:'1rem',textDecoration:'none'}}>Create your organization →</Link>
        <p style={{marginTop:'14px',color:'#9ca3af',fontSize:'0.85rem'}}>Questions? <a href="mailto:orgs@thriveathome.app" style={{color:'#6366f1'}}>orgs@thriveathome.app</a></p>
      </section>
    </main>
  )
}
