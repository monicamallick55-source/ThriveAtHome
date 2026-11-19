import Link from 'next/link'

export default function HomePage() {
  return (
    <main style={{fontFamily:'system-ui,sans-serif'}}>
      {/* Hero — explicit split */}
      <section style={{background:'linear-gradient(135deg,#f0f4ff 0%,#faf5ff 100%)',padding:'80px 24px 100px',textAlign:'center'}}>
        <div style={{maxWidth:'760px',margin:'0 auto'}}>
          <h1 style={{fontSize:'clamp(2rem,5vw,3rem)',fontWeight:800,color:'#111827',lineHeight:1.15,marginBottom:'16px'}}>
            Helping seniors thrive at home
          </h1>
          <p style={{fontSize:'1.15rem',color:'#6b7280',maxWidth:'520px',margin:'0 auto 56px',lineHeight:1.6}}>
            AI check-ins, care coordination, and community connection — for individuals and organizations.
          </p>

          {/* The two front doors */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'24px',maxWidth:'680px',margin:'0 auto'}}>
            {/* D2C */}
            <div style={{background:'#fff',borderRadius:'20px',padding:'36px 28px',border:'2px solid #e5e7eb',textAlign:'left'}}>
              <div style={{fontSize:'2rem',marginBottom:'12px'}}>👵</div>
              <h2 style={{fontSize:'1.2rem',fontWeight:700,color:'#111827',marginBottom:'8px'}}>For a senior or loved one</h2>
              <p style={{color:'#6b7280',fontSize:'0.9rem',lineHeight:1.6,marginBottom:'24px'}}>
                Daily AI check-ins, family dashboard, emergency coordination, and community connection.
              </p>
              <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'20px'}}>
                {['Basic — $39/mo','Complete — $79/mo','Premier — $149/mo'].map(p=>(
                  <div key={p} style={{fontSize:'0.85rem',color:'#374151',display:'flex',gap:'8px'}}>
                    <span style={{color:'#10b981',fontWeight:700}}>✓</span>{p}
                  </div>
                ))}
              </div>
              <Link href="/signup" style={{display:'block',textAlign:'center',background:'#6366f1',color:'#fff',textDecoration:'none',padding:'12px',borderRadius:'10px',fontWeight:700,fontSize:'0.95rem'}}>
                Start free trial →
              </Link>
              <p style={{textAlign:'center',marginTop:'10px',fontSize:'0.78rem',color:'#9ca3af'}}>14 days free · No credit card</p>
            </div>

            {/* B2B */}
            <div style={{background:'#1e1b4b',borderRadius:'20px',padding:'36px 28px',border:'2px solid #3730a3',textAlign:'left'}}>
              <div style={{fontSize:'2rem',marginBottom:'12px'}}>🏘️</div>
              <h2 style={{fontSize:'1.2rem',fontWeight:700,color:'#fff',marginBottom:'8px'}}>For your organization</h2>
              <p style={{color:'#a5b4fc',fontSize:'0.9rem',lineHeight:1.6,marginBottom:'24px'}}>
                Launch a village network, power a caregiver benefit, or scale senior services — white-labeled and ready in weeks.
              </p>
              <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'20px'}}>
                {['Village networks','Employers & health plans','Senior centers & AAAs'].map(p=>(
                  <div key={p} style={{fontSize:'0.85rem',color:'#c7d2fe',display:'flex',gap:'8px'}}>
                    <span style={{color:'#818cf8',fontWeight:700}}>✓</span>{p}
                  </div>
                ))}
              </div>
              <Link href="/for-organizations" style={{display:'block',textAlign:'center',background:'#6366f1',color:'#fff',textDecoration:'none',padding:'12px',borderRadius:'10px',fontWeight:700,fontSize:'0.95rem'}}>
                Explore org plans →
              </Link>
              <p style={{textAlign:'center',marginTop:'10px',fontSize:'0.78rem',color:'#6366f1'}}>Free to start · No credit card</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{padding:'80px 24px',maxWidth:'1000px',margin:'0 auto'}}>
        <h2 style={{textAlign:'center',fontSize:'1.75rem',fontWeight:700,color:'#111827',marginBottom:'48px'}}>Everything needed to thrive at home</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'28px'}}>
          {[
            {icon:'📞',title:'Daily check-in calls',desc:'Aria AI calls every day, tracks mood and energy, and surfaces concerns to your family dashboard.'},
            {icon:'👨‍👩‍👧',title:'Family dashboard',desc:'Real-time visibility for family members — activity, check-in summaries, and alerts.'},
            {icon:'🏘️',title:'Community connection',desc:'Local chapters, volunteer matching, skill exchanges, and social events.'},
            {icon:'🚨',title:'Emergency coordination',desc:'One-touch response with automatic notification to your full care circle.'},
            {icon:'🧭',title:'Dedicated navigator',desc:'A human care coordinator helps with services, appointments, and life transitions.'},
            {icon:'🛡️',title:'Fraud protection',desc:'Real-time alerts protecting seniors from scams and financial exploitation.'},
          ].map(f=>(
            <div key={f.title} style={{padding:'24px',borderRadius:'14px',border:'1px solid #f3f4f6',background:'#fff'}}>
              <div style={{fontSize:'1.75rem',marginBottom:'10px'}}>{f.icon}</div>
              <h3 style={{fontWeight:700,color:'#111827',marginBottom:'6px',fontSize:'0.95rem'}}>{f.title}</h3>
              <p style={{color:'#6b7280',fontSize:'0.875rem',lineHeight:1.6,margin:0}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{background:'#111827',color:'#6b7280',padding:'32px 24px',textAlign:'center',fontSize:'0.85rem'}}>
        <div style={{maxWidth:'900px',margin:'0 auto',display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:'12px'}}>
          <span>© 2026 Thrive@Home</span>
          <div style={{display:'flex',gap:'24px'}}>
            <a href="/pricing" style={{color:'#6b7280',textDecoration:'none'}}>Pricing</a>
            <a href="/for-organizations" style={{color:'#6b7280',textDecoration:'none'}}>For Organizations</a>
            <a href="/login" style={{color:'#6b7280',textDecoration:'none'}}>Sign In</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
