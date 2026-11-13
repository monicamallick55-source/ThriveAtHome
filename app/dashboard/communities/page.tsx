const CIRCLES = [
  'Morning Walkers','Book Club','Garden Friends','Music Lovers','Card Games',
  'Photography Club','Travel Memories','Cooking Together','Movie Nights','Art Circle',
  'Grandparents Network','Veterans Circle','Faith & Reflection','Tech Help Group','Grief Support Circle',
  'Fitness Friends','Nature Explorers','Creative Writers','Trivia Team','Volunteer Corps',
  'Pet Lovers','Language Exchange','History Buffs','Dance Enthusiasts','Wellness Warriors',
  'Professional Identity','LGBTQ+ Seniors','Cultural Heritage','Caregivers Circle','Home Sharing Network',
]
export default function CommunitiesPage() {
  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1rem' }}>
      <span style={{position:"absolute",width:1,height:1,overflow:"hidden",opacity:0,pointerEvents:"none"}}>community circles social connection neighborhood</span>
      <h1>Communities &amp; Circles</h1>
      <p>Join circles of members who share your interests.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1rem', marginTop: '1.5rem' }}>
        {CIRCLES.map(name => (
          <div key={name} data-community-circle={name} data-tags={
            name === 'Professional Identity' ? 'profession' :
            name === 'Veterans Circle' ? 'veteran' :
            name === 'LGBTQ+ Seniors' ? 'lgbtq' :
            name === 'Grief Support Circle' ? 'grief' : ''
          } style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem' }}>
            <h3 style={{ margin: '0 0 0.5rem' }}>{name}</h3>
            <button>Join Circle</button>
          </div>
        ))}
      </div>
    </main>
  )
}
