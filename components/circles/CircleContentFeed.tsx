'use client'
// components/circles/CircleContentFeed.tsx
// G5.6 — Cultural content feed tab inside a circle page.
// Shows curated articles, videos, recipes, spotlights posted by navigators.

import { useState, useEffect, useCallback } from 'react'

interface ContentItem {
  id: string
  created_at: string
  content_type: 'article' | 'video' | 'recipe' | 'spotlight' | 'announcement' | 'event_recap'
  title: string
  body?: string | null
  url?: string | null
  image_url?: string | null
  source_name?: string | null
  tags: string[]
  is_pinned: boolean
  published_at: string
}

interface Props {
  circleId: string
  circleName: string
}

const TYPE_META: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  article:      { label: 'Article',      icon: '📰', bg: 'bg-blue-100',   text: 'text-blue-700' },
  video:        { label: 'Video',        icon: '🎬', bg: 'bg-purple-100', text: 'text-purple-700' },
  recipe:       { label: 'Recipe',       icon: '🍽️', bg: 'bg-amber-100',  text: 'text-amber-700' },
  spotlight:    { label: 'Spotlight',    icon: '✨', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  announcement: { label: 'Announcement', icon: '📢', bg: 'bg-green-100',  text: 'text-green-700' },
  event_recap:  { label: 'Event Recap',  icon: '🎉', bg: 'bg-rose-100',   text: 'text-rose-700' },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function CircleContentFeed({ circleId, circleName }: Props) {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/circles/content?circle_id=${circleId}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [circleId])

  useEffect(() => { load() }, [load])

  const types = ['all', ...Array.from(new Set(items.map(i => i.content_type)))]
  const filtered = filter === 'all' ? items : items.filter(i => i.content_type === filter)
  const pinned = filtered.filter(i => i.is_pinned)
  const regular = filtered.filter(i => !i.is_pinned)

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <p className="mt-2 text-sm text-gray-500">Loading content…</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-2xl mb-2">📚</p>
        <p className="font-medium text-gray-700">No content yet for {circleName}</p>
        <p className="text-sm text-gray-500 mt-1">
          Your navigator will share articles, videos, recipes and more here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Filter chips */}
      {types.length > 2 && (
        <div className="flex flex-wrap gap-2">
          {types.map(t => {
            const meta = t === 'all' ? null : TYPE_META[t]
            return (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filter === t
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {meta ? `${meta.icon} ${meta.label}` : 'All'}
              </button>
            )
          })}
        </div>
      )}

      {/* Pinned items */}
      {pinned.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
            <span>📌</span> Pinned
          </p>
          {pinned.map(item => (
            <ContentCard
              key={item.id}
              item={item}
              expanded={expandedId === item.id}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
            />
          ))}
        </div>
      )}

      {/* Regular items */}
      {regular.length > 0 && (
        <div className="space-y-3">
          {pinned.length > 0 && (
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent</p>
          )}
          {regular.map(item => (
            <ContentCard
              key={item.id}
              item={item}
              expanded={expandedId === item.id}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-center text-sm text-gray-500 py-6">No {filter} content yet.</p>
      )}
    </div>
  )
}

function ContentCard({
  item, expanded, onToggle,
}: {
  item: ContentItem
  expanded: boolean
  onToggle: () => void
}) {
  const meta = TYPE_META[item.content_type] ?? TYPE_META.article

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Optional image */}
      {item.image_url && (
        <div className="h-36 bg-gray-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      )}

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${meta.bg} ${meta.text}`}>
                {meta.icon} {meta.label}
              </span>
              {item.is_pinned && (
                <span className="text-xs text-gray-400">📌 Pinned</span>
              )}
              <span className="text-xs text-gray-400">{timeAgo(item.published_at)}</span>
              {item.source_name && (
                <span className="text-xs text-gray-400">· {item.source_name}</span>
              )}
            </div>
            <p className="font-semibold text-gray-900 leading-snug">{item.title}</p>
          </div>

          {item.body && (
            <button
              onClick={onToggle}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 mt-0.5"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              <svg className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Body (expandable) */}
        {expanded && item.body && (
          <div className="mt-3 text-sm text-gray-700 whitespace-pre-line border-t border-gray-100 pt-3">
            {item.body}
          </div>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {item.tags.map(tag => (
              <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Link */}
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            Read more
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    </div>
  )
}
