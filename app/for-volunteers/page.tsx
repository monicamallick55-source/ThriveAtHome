export default function ForVolunteersPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-emerald-50 to-teal-100 py-20 px-4 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Volunteer with Thrive@Home</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">Make a real difference in a senior&apos;s life.</p>
        <a href="/signup?role=volunteer" className="inline-block bg-emerald-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-emerald-700 transition">Sign Up to Volunteer</a>
      </section>
      <section className="max-w-5xl mx-auto py-16 px-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Ways to Give Back</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[{e:'📞',t:'Friendly Calls',d:'Spend 20–30 min/week chatting with a senior.'},{e:'🛒',t:'Neighborhood Help',d:'Assist with errands for seniors in your area.'},{e:'🎓',t:'Share Your Skills',d:'Teach tech, offer guidance, lead a fitness class.'}].map(i=>(
            <div key={i.t} className="bg-gray-50 rounded-2xl p-6"><div className="text-4xl mb-3">{i.e}</div><h3 className="font-semibold mb-2">{i.t}</h3><p className="text-gray-600 text-sm">{i.d}</p></div>
          ))}
        </div>
      </section>
    </main>
  )
}
