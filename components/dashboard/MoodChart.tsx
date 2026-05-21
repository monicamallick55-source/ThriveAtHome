'use client'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { Tabs } from '@/components/ui/Tabs'
import type { CheckInCall } from '@/lib/data/calls'

type Days = 7 | 30 | 60 | 90

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
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

function moodDotColor(score: number): string {
  if (score >= 7) return '#2A7A4F'
  if (score >= 4) return '#8B6914'
  return '#9B2D1A'
}

function yAxisLabel(value: number): string {
  if (value === 10) return 'Great'
  if (value === 5) return 'Okay'
  if (value === 1) return 'Tough'
  return ''
}

interface CustomDotProps {
  cx?: number
  cy?: number
  payload?: { mood: number }
}

function CustomDot({ cx, cy, payload }: CustomDotProps) {
  if (cx === undefined || cy === undefined || !payload) return null
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={moodDotColor(payload.mood)}
      stroke="white"
      strokeWidth={2}
    />
  )
}

function ChartContent({ calls, days }: { calls: CheckInCall[]; days: Days }) {
  const chartData = filterCallsByDays(calls, days)

  if (chartData.length === 0) {
    return (
      <p
        style={{
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: '18px',
          fontFamily: 'var(--font-body)',
          padding: '40px 0',
        }}
      >
        No mood data in this window yet.
      </p>
    )
  }

  return (
    <div aria-label={`Mood trend chart — last ${days} days`} role="img" style={{ paddingTop: '8px' }}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <ReferenceLine y={5} stroke="#E8E6DF" strokeDasharray="0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 13, fill: '#7A746C', fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[1, 10]}
            ticks={[1, 5, 10]}
            tickFormatter={yAxisLabel}
            tick={{ fontSize: 13, fill: '#7A746C' }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={{
              fontSize: 15,
              borderRadius: '10px',
              border: '1px solid #E8E6DF',
              backgroundColor: 'white',
              boxShadow: '0 4px 12px rgba(26,24,20,0.08)',
            }}
            formatter={(value: unknown) => [`${value} / 10`, 'Mood']}
          />
          <Line
            type="monotone"
            dataKey="mood"
            stroke="#2A9D8F"
            strokeWidth={2.5}
            dot={<CustomDot />}
            activeDot={{ r: 7, fill: '#2A9D8F' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

const TAB_DAYS: Days[] = [7, 30, 60, 90]

export interface MoodChartProps {
  calls: CheckInCall[]
}

export function MoodChart({ calls }: MoodChartProps) {
  const tabs = TAB_DAYS.map((days) => ({
    id: `${days}d`,
    label: `${days} days`,
    content: <ChartContent calls={calls} days={days} />,
  }))

  return (
    <Tabs
      tabs={tabs}
      label="Mood chart time period"
      variant="pill"
    />
  )
}
