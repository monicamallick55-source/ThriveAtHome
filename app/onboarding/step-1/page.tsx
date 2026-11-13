'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
export default function OnboardingStep1() {
  const router = useRouter()
  const [form, setForm] = useState({ first_name: '', last_name: '', zip_code: '' })
  function handleNext() {
    if (!form.first_name || !form.last_name || !form.zip_code) return
    sessionStorage.setItem('onboarding_step1', JSON.stringify(form))
    router.push('/onboarding/step-2')
  }
  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <span style={{position:'absolute',left:-9999,top:'auto',width:1,height:1,overflow:'hidden'}}>onboarding personal info step 1</span>
      <h1 className="text-2xl font-bold text-[#1B3A6B] mb-6">Tell us about yourself</h1>
      <div className="space-y-4">
        <input name="first_name" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder="First name" className="w-full border rounded-lg px-4 py-3" />
        <input name="last_name" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Last name" className="w-full border rounded-lg px-4 py-3" />
        <input name="zip_code" value={form.zip_code} onChange={e => setForm(f => ({ ...f, zip_code: e.target.value }))} placeholder="ZIP code" className="w-full border rounded-lg px-4 py-3" />
        <button data-testid="next-step" onClick={handleNext} className="w-full bg-[#2A9D8F] text-white font-semibold py-3 rounded-xl">Continue →</button>
      </div>
    </div>
  )
}
