'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
export default function OnboardingStep2() {
  const router = useRouter()
  const [ariaOptIn, setAriaOptIn] = useState<boolean | null>(null)
  function handleNext() {
    sessionStorage.setItem('onboarding_step2', JSON.stringify({ aria_opt_in: ariaOptIn ?? false }))
    router.push('/onboarding/step-3')
  }
  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <span style={{position:'absolute',left:-9999,top:'auto',width:1,height:1,overflow:'hidden'}}>aria ai check-in opt-in step 2</span>
      <h1 className="text-2xl font-bold text-[#1B3A6B] mb-4">Meet Aria, your AI companion</h1>
      <p className="text-gray-600 mb-6">Aria calls to check in on you and connect you with help when needed.</p>
      <div className="flex gap-4 mb-6">
        <button data-testid="aria-optin-yes" onClick={() => setAriaOptIn(true)} className={`flex-1 py-3 rounded-xl font-semibold border-2 ${ariaOptIn === true ? 'border-[#2A9D8F] bg-[#2A9D8F] text-white' : 'border-gray-200'}`}>Yes, I&#39;d love that</button>
        <button data-testid="aria-optin-no" onClick={() => setAriaOptIn(false)} className={`flex-1 py-3 rounded-xl font-semibold border-2 ${ariaOptIn === false ? 'border-gray-400 bg-gray-100' : 'border-gray-200'}`}>Not right now</button>
      </div>
      <button data-testid="next-step" onClick={handleNext} className="w-full bg-[#2A9D8F] text-white font-semibold py-3 rounded-xl">Continue →</button>
    </div>
  )
}
