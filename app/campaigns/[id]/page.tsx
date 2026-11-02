'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Campaign {
  id: string; title: string; description: string; cause_category: string
  goal_amount: number; raised_amount: number; donor_count: number; status: string
  cover_image_url: string | null; end_date: string | null
  stripe_payment_link_url: string | null
  members: { first_name: string; last_name: string }
  campaign_donations: Array<{ id: string; amount: number; donor_name: string | null; message: string | null; is_anonymous: boolean; created_at: string }>
}

function ProgressBar({ raised, goal }: { raised: number; goal: number }) {
  const pct = Math.min(100, Math.round((raised / goal) * 100))
  return (
    <div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
        <div className="bg-indigo-600 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-sm mt-1 text-gray-600 dark:text-gray-400">
        <span className="font-semibold text-gray-900 dark:text-white">${raised.toLocaleString()} raised</span>
        <span>{pct}% of ${goal.toLocaleString()}</span>
      </div>
    </div>
  )
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/campaigns/${id}`).then(r => r.json()).then(d => { setCampaign(d); setLoading(false) })
  }, [id])

  if (loading) return <div className="text-center py-20 text-gray-400">Loading…</div>
  if (!campaign) return <div className="text-center py-20 text-gray-400">Campaign not found.</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link href="/campaigns" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">← All Campaigns</Link>
      {searchParams.get('submitted') === 'true' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
          <p className="text-green-800 dark:text-green-300 font-medium">✅ Campaign submitted for review!</p>
          <p className="text-green-700 dark:text-green-400 text-sm mt-1">A navigator will review your campaign within 2 business days.</p>
        </div>
      )}
      {searchParams.get('donated') === 'true' && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 mb-6">
          <p className="text-indigo-800 dark:text-indigo-300 font-medium">💜 Thank you for your donation!</p>
        </div>
      )}
      {campaign.cover_image_url && <img src={campaign.cover_image_url} alt={campaign.title} className="w-full h-64 object-cover rounded-xl mb-6" />}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">{campaign.cause_category}</span>
        {campaign.status === 'pending_review' && <span className="text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">Pending Review</span>}
      </div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{campaign.title}</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        Started by {campaign.members.first_name} {campaign.members.last_name}
        {campaign.end_date && ` · Ends ${new Date(campaign.end_date).toLocaleDateString()}`}
      </p>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
        <ProgressBar raised={campaign.raised_amount} goal={campaign.goal_amount} />
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">{campaign.donor_count} donor{campaign.donor_count !== 1 ? 's' : ''}</p>
        {campaign.stripe_payment_link_url && campaign.status === 'active' && (
          <a href={campaign.stripe_payment_link_url} target="_blank" rel="noopener noreferrer" className="mt-4 w-full block text-center bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">Donate Now</a>
        )}
      </div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">About this campaign</h2>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{campaign.description}</p>
      </div>
      {campaign.campaign_donations.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Donations</h2>
          <div className="space-y-3">
            {campaign.campaign_donations.slice(0,10).map(d => (
              <div key={d.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-sm flex-shrink-0">{d.is_anonymous ? '?' : (d.donor_name?.[0] || '?')}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{d.is_anonymous ? 'Anonymous' : (d.donor_name || 'Someone')}<span className="ml-2 text-indigo-600 font-semibold">${d.amount.toFixed(2)}</span></p>
                  {d.message && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{d.message}</p>}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{new Date(d.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
