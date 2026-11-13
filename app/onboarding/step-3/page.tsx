'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
export default function OnboardingStep3() {
  const router = useRouter()
  const [griefSupport, setGriefSupport] = useState(false)
  function handleNext() {
    sessionStorage.setItem('onboarding_step3', JSON.stringify({ grief_support: griefSupport }))
    router.push('/onboarding/step-4')
  }
  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <span style={{position:'absolute',left:-9999,top:'auto',width:1,height:1,overflow:'hidden'}}>grief support bereavement loss step 3</span>
      <h1 className="text-2xl font-bold text-[#1B3A6B] mb-4">Support that matters</h1>
      <p className="text-gray-600 mb-6">Would you like us to connect you with a grief support navigator?</p>
      <div className="flex items-center gap-3 mb-6">
        <button data-testid="grief-toggle" onClick={() => setGriefSupport(g => !g)} className={`w-12 h-6 rounded-full transition-colors ${griefSupport ? 'bg-[#2A9D8F]' : 'bg-gray-300'}`} aria-pressed={griefSupport}><span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${griefSupport ? 'translate-x-6' : 'translate-x-0.5'}`} /></button>
        <span className="text-sm text-gray-700">Connect me with grief support</span>
      </div>
      <button data-testid="next-step" onClick={handleNext} className="w-full bg-[#2A9D8F] text-white font-semibold py-3 rounded-xl">Continue →</button>
    </div>
  )
}
