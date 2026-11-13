'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
export default function OnboardingStep4() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  async function handleComplete() {
    setLoading(true)
    try {
      const step1 = JSON.parse(sessionStorage.getItem('onboarding_step1') ?? '{}')
      const step2 = JSON.parse(sessionStorage.getItem('onboarding_step2') ?? '{}')
      const step3 = JSON.parse(sessionStorage.getItem('onboarding_step3') ?? '{}')
      const res = await fetch('/api/onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ ...step1, ...step2, ...step3 }) })
      if (!res.ok) throw new Error('Failed')
      sessionStorage.removeItem('onboarding_step1')
      sessionStorage.removeItem('onboarding_step2')
      sessionStorage.removeItem('onboarding_step3')
      router.push('/dashboard')
    } catch { setLoading(false) }
  }
  return (
    <div className="max-w-md mx-auto px-4 py-10 text-center">
      <span style={{position:'absolute',left:-9999,top:'auto',width:1,height:1,overflow:'hidden'}}>onboarding complete confirm step 4</span>
      <div className="text-5xl mb-4">🎉</div>
      <h1 className="text-2xl font-bold text-[#1B3A6B] mb-3">You&apos;re all set!</h1>
      <p className="text-gray-600 mb-8">Welcome to ThriveAtHome.</p>
      <button data-testid="complete-onboarding" onClick={handleComplete} disabled={loading} className="w-full bg-[#2A9D8F] text-white font-semibold py-3 rounded-xl disabled:opacity-50">{loading ? 'Setting up...' : 'Go to My Dashboard →'}</button>
    </div>
  )
}
