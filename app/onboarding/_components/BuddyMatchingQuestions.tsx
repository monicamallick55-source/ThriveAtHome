'use client'
const TOPICS = ['Family and grandchildren','Stories from their working years','The neighbourhood as it used to be','Current events and the news','Sports (past or present)','Faith and spirituality','Music and the arts','Cooking and food memories','Travel and adventure stories','Books and reading','Gardening and nature','Health and staying active']
const ERAS = ['Growing up and childhood','Young adult years','Raising a family','Career and working years','Recent decades','They enjoy all eras equally']
const CALL_LENGTHS = ['Short and sweet (around 20 minutes)','They love a long chat (45 minutes+)',"It varies — they'll let the buddy know"]

interface BuddyMatchingData { buddy_match_topics: string[]; buddy_match_era: string; buddy_call_length_preference: string; buddy_intro_note: string; buddy_preferences_note: string }
interface Props { memberName: string; planTier: string; data: BuddyMatchingData; onChange: (data: BuddyMatchingData) => void }

export default function BuddyMatchingQuestions({ memberName, planTier, data, onChange }: Props) {
  if (!['connect','complete','premier'].includes(planTier)) return null
  const name = memberName || 'your loved one'
  const toggleTopic = (topic: string) => {
    const current = data.buddy_match_topics ?? []
    if (current.includes(topic)) onChange({ ...data, buddy_match_topics: current.filter(t => t !== topic) })
    else if (current.length < 3) onChange({ ...data, buddy_match_topics: [...current, topic] })
  }
  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Your buddy match preferences</h3>
      <p className="text-sm text-gray-500 mb-6">We'll use these to find someone who clicks with {name}.</p>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-800 mb-3">What does {name} most enjoy talking about? <span className="text-gray-400 font-normal">Pick up to 3</span></label>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map(topic => { const sel = (data.buddy_match_topics ?? []).includes(topic); const maxed = (data.buddy_match_topics ?? []).length >= 3 && !sel; return <button key={topic} type="button" onClick={() => toggleTopic(topic)} disabled={maxed} className={`px-3 py-1.5 rounded-full text-sm border transition ${sel ? 'bg-[#2A9D8F] text-white border-[#2A9D8F]' : maxed ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400'}`}>{topic}</button> })}
        </div>
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-800 mb-3">Which era of life would they most enjoy reminiscing about?</label>
        <div className="space-y-2">{ERAS.map(era => <label key={era} className="flex items-center gap-3 cursor-pointer"><input type="radio" name="buddy_match_era" value={era} checked={data.buddy_match_era === era} onChange={() => onChange({ ...data, buddy_match_era: era })} className="text-[#2A9D8F]" /><span className="text-sm text-gray-700">{era}</span></label>)}</div>
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-800 mb-3">How long does {name} usually like to talk on the phone?</label>
        <div className="space-y-2">{CALL_LENGTHS.map(len => <label key={len} className="flex items-center gap-3 cursor-pointer"><input type="radio" name="buddy_call_length_preference" value={len} checked={data.buddy_call_length_preference === len} onChange={() => onChange({ ...data, buddy_call_length_preference: len })} className="text-[#2A9D8F]" /><span className="text-sm text-gray-700">{len}</span></label>)}</div>
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-800 mb-1">Is there anything you'd want their buddy to know before the first call? <span className="text-gray-400 font-normal">(optional)</span></label>
        <textarea rows={2} value={data.buddy_intro_note ?? ''} onChange={e => onChange({ ...data, buddy_intro_note: e.target.value })} placeholder="e.g. She's shy at first but opens up quickly. He loves dad jokes." className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-teal-400" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Any preferences for the buddy? <span className="text-gray-400 font-normal">(optional)</span></label>
        <textarea rows={2} value={data.buddy_preferences_note ?? ''} onChange={e => onChange({ ...data, buddy_preferences_note: e.target.value })} placeholder="e.g. A woman would be best. Someone who speaks Spanish." className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-teal-400" />
      </div>
    </div>
  )
}
