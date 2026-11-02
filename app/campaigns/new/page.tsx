'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = ['health','community','education','arts','environment','seniors','other']

export default function NewCampaignPage() {
  const router = useRouter()
  const [form, setForm] = useState({ title: '', description: '', cause_category: 'community', goal_amount: '', end_date: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await fetch('/api/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, goal_amount: parseFloat(form.goal_amount) }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); setLoading(false); return }
      router.push(`/campaigns/${data.id}?submitted=true`)
    } catch { setError('Network error'); setLoading(false) }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Start a Campaign</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">Complete and Premier members can start fundraising campaigns. Your campaign will be reviewed by a navigator before going live.</p>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Campaign Title</label>
          <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Help seniors in our city get warm meals" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
          <select value={form.cause_category} onChange={e => setForm(f => ({ ...f, cause_category: e.target.value }))} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
            {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fundraising Goal ($)</label>
          <input required type="number" min="50" step="1" value={form.goal_amount} onChange={e => setForm(f => ({ ...f, goal_amount: e.target.value }))} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date (optional)</label>
          <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea required rows={5} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="Tell your story — why does this cause matter to you and your community?" />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">{loading ? 'Submitting…' : 'Submit for Review'}</button>
        <p className="text-xs text-center text-gray-400">100% of donations go to your cause. Navigators review campaigns within 2 business days.</p>
      </form>
    </div>
  )
}
