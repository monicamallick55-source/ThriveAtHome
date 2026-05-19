'use client'
// MoodChart — Recharts LineChart of mood scores over 7/30/60/90-day windows.
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Tabs } from '@/components/ui/Tabs'
import type { CheckInCall } from '@/lib/data/calls'

type Days = 7 | 30 | 60 | 90

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function filterCallsByDays(calls: CheckInCall[], days: Days) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return calls
    .filter((c) => {
      if (c.mood_score === null) return false
      const d = new Date(c.scheduled_at ?? c.created_at)
      return d >= cutoff
    })
    .sort((a, b) => {
      const da = new Date(a.scheduled_at ?? a.created_at).getTime()
      const db = new Date(b.scheduled_at ?? b.created_at).getTime()
      return da - db
    })
    .map((c) => ({
      date: formatDate(c.scheduled_at ?? c.created_at),
      mood: c.mood_score as number,
    }))
}

function ChartContent({ calls, days }: { calls: CheckInCall[]; days: Days }) {
  const chartData = filterCallsByDays(calls, days)

  if (chartData.length === 0) {
    return (
      <p className="text-center text-gray-500 text-lg py-10">
        No mood data in this window yet.
      </p>
    )
  }

  return (
    <div aria-label={`Mood trend chart — last ${days} days`} role="img">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 14, fill: '#6B7280' }}
            tickLine={false}
          />
          <YAxis
            domain={[1, 10]}
            ticks={[1, 3, 5, 7, 9]}
            tick={{ fontSize: 14, fill: '#6B7280' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{ fontSize: 14, borderRadius: 8 }}
            formatter={(value: unknown) => [`${value} / 10`, 'Mood']}
          />
          <Line
            type="monotone"
            dataKey="mood"
            stroke="#1B3A6B"
            strokeWidth={2.5}
            dot={{ r: 5, fill: '#1B3A6B', strokeWidth: 0 }}
            activeDot={{ r: 7, fill: '#2A9D8F' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export interface MoodChartProps {
  calls: CheckInCall[]
}

export function MoodChart({ calls }: MoodChartProps) {
  const tabs = [
    { id: '7d', label: '7 days', content: <ChartContent calls={calls} days={7} /> },
    { id: '30d', label: '30 days', content: <ChartContent calls={calls} days={30} /> },
    { id: '60d', label: '60 days', content: <ChartContent calls={calls} days={60} /> },
    { id: '90d', label: '90 days', content: <ChartContent calls={calls} days={90} /> },
  ]

  return <Tabs tabs={tabs} label="Mood trend time range" defaultTab="7d" />
}
