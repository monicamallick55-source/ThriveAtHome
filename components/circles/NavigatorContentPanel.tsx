'use client'
// components/circles/NavigatorContentPanel.tsx
// G5.6 — Navigator UI for posting curated content to a circle's content feed.
// Used inside the navigator/circles management page.

import { useState, useEffect, useCallback } from 'react'

interface Circle {
  id: string
  circle_name: string
  community_type: string | null
}

interface ContentItem {
  id: string
  content_type: string
  title: string
  body?: string | null
  url?: string | null
  source_name?: string | null
  tags: string[]
  is_pinned: boolean
  published_at: string
  is_published: boolean
}

interface Props {
  circles: Circle[]
}

const CONTENT_TYPES = [
  { value: 'article',      label: '📰 Article' },
  { value: 'video',        label: '🎬 Video' },
  { value: 'recipe',       label: '🍽️ Recipe' },
  { value: 'spotlight',    label: '✨ Spotlight' },
  { value: 'announcement', label: '📢 Announcement' },
  { value: 'event_recap',  label: '🎉 Event Recap' },
]

export default function NavigatorContentPanel({ circles }: Props) {
  const [selectedCircle, setSelectedCircle] = useState<string>(circles[0]?.id ?? '')
  const [items, setItems] = useState<ContentItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const [form, setForm] = useState({
    content_type: 'article',
    title: '',
    body: '',
    url: '',
    image_url: '',
    source_name: '',
    tags: '',
    is_pinned: false,
  })

  const loadItems = useCallback(async () => {
    if (!selectedCircle) return
    setLoadingItems(true)
    try {
      const res = await fetch(`/api/circles/content?circle_id=${selectedCircle}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items ?? [])
      }
    } finally {
      setLoadingItems(false)
    }
  }, [selectedCircle])

  useEffect(() => { loadItems() }, [loadItems])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/circles/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          circle_id: selectedCircle,
          content_type: form.content_type,
          title: form.title.trim(),
          body: form.body.trim() || null,
          url: form.url.trim() || null,
          image_url: form.image_url.trim() || null,
          source_name: form.source_name.trim() || null,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
          is_pinned: form.is_pinned,
        }),
      })
      if (res.ok) {
        setForm({ content_type: 'article', title: '', body: '', url: '', image_url: '', source_name: '', tags: '', is_pinned: false })
        setShowForm(false)
        setSuccessMsg('Content posted successfully.')
        setTimeout(() => setSuccessMsg(''), 4000)
        loadItems()
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function togglePin(item: ContentItem) {
    await fetch(`/api/circles/content/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_pinned: !item.is_pinned }),
    })
    loadItems()
  }

  async function removeItem(id: string) {
    if (!confirm('Remove this content item?')) return
    await fetch(`/api/circles/content/${id}`, { method: 'DELETE' })
    loadItems()
  }

  const circleName = circles.find(c => c.id === selectedCircle)?.circle_name ?? ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Circle:</label>
          <select
            value={selectedCircle}
            onChange={e => setSelectedCircle(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {circles.map(c => (
              <option key={c.id} value={c.id}>{c.circle_name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add content'}
        </button>
      </div>

      {successMsg && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          {successMsg}
        </div>
      )}

      {/* Post form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 space-y-4">
          <h3 className="font-semibold text-indigo-900">New content for {circleName}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.content_type}
                onChange={e => setForm(f => ({ ...f, content_type: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CONTENT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Source / Publisher</label>
              <input
                type="text"
                placeholder="e.g. AARP, NPR, NYT Cooking"
                value={form.source_name}
                onChange={e => setForm(f => ({ ...f, source_name: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Content title"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Body / Description (optional)</label>
            <textarea
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              rows={3}
              placeholder="A brief summary or introduction for members…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Link URL</label>
              <input
                type="url"
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Image URL (optional)</label>
              <input
                type="url"
                value={form.image_url}
                onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                placeholder="https://…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="e.g. health, recipes, heritage"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_pinned}
              onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">📌 Pin this item to the top</span>
          </label>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting || !form.title.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Posting…' : 'Post content'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Items list */}
      {loadingItems ? (
        <div className="py-6 text-center">
          <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-500">No content posted to {circleName} yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {items.length} item{items.length !== 1 ? 's' : ''} in {circleName}
          </p>
          {items.map(item => (
            <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-xs font-medium text-gray-500 capitalize">
                    {item.content_type.replace(/_/g, ' ')}
                  </span>
                  {item.is_pinned && <span className="text-xs text-amber-600">📌 Pinned</span>}
                </div>
                <p className="font-medium text-gray-900 text-sm leading-snug">{item.title}</p>
                {item.source_name && (
                  <p className="text-xs text-gray-400 mt-0.5">{item.source_name}</p>
                )}
                {item.tags.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">#{item.tags.join(' #')}</p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => togglePin(item)}
                  title={item.is_pinned ? 'Unpin' : 'Pin'}
                  className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  {item.is_pinned ? '📌 Unpin' : '📌 Pin'}
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
