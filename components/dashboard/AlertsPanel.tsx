'use client'
// AlertsPanel — shows active alerts with realtime new-alert subscriptions.
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { StatusDot } from '@/components/ui/StatusDot'
import { SectionError } from './SectionError'
import type { Alert } from '@/lib/data/alerts'
import type { BadgeVariant } from '@/components/ui/Badge'
import type { StatusLevel } from '@/components/ui/StatusDot'

const severityBadge: Record<string, BadgeVariant> = {
  informational: 'info',
  concern: 'concern',
  urgent: 'urgent',
  emergency: 'emergency',
}

const alertTypeLabel: Record<string, string> = {
  missed_call: 'Missed call',
  mood_drop: 'Mood drop',
  medication_miss: 'Medication missed',
  wellness_drift: 'Wellness decline',
  fall: 'Fall detected',
  crisis: 'Crisis',
  emergency: 'Emergency',
}

function highestSeverity(alerts: Alert[]): StatusLevel {
  const unacked = alerts.filter((a) => !a.acknowledged)
  if (unacked.some((a) => a.severity === 'emergency')) return 'emergency'
  if (unacked.some((a) => a.severity === 'urgent')) return 'urgent'
  if (unacked.some((a) => a.severity === 'concern')) return 'concern'
  if (unacked.length > 0) return 'concern'
  return 'no_alerts'
}

function formatAge(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export interface AlertsPanelProps {
  memberId: string
  familyMemberId: string | null
  initialAlerts: Alert[]
  error: string | null
}

export function AlertsPanel({ memberId, familyMemberId, initialAlerts, error }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts)
  const [acknowledging, setAcknowledging] = useState<string | null>(null)

  // Realtime subscription: new alerts inserted for this member
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`alerts:${memberId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
          filter: `member_id=eq.${memberId}`,
        },
        (payload) => {
          setAlerts((prev) => [payload.new as Alert, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [memberId])

  async function handleAcknowledge(alertId: string) {
    if (!familyMemberId) return
    setAcknowledging(alertId)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('alerts')
      .update({
        acknowledged: true,
        acknowledged_by: familyMemberId,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', alertId)
    if (!err) {
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? { ...a, acknowledged: true, acknowledged_at: new Date().toISOString() }
            : a
        )
      )
    }
    setAcknowledging(null)
  }

  if (error) return <SectionError message={error} />

  const unacked = alerts.filter((a) => !a.acknowledged)
  const acked = alerts.filter((a) => a.acknowledged)
  const status = highestSeverity(alerts)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <StatusDot level={status} size="md" />
        <span className="text-lg font-semibold text-brand-navy">
          {unacked.length === 0
            ? 'No active alerts'
            : `${unacked.length} active alert${unacked.length === 1 ? '' : 's'}`}
        </span>
      </div>

      {unacked.length === 0 && acked.length === 0 && (
        <p className="text-gray-500 text-lg">All clear — no alerts at this time.</p>
      )}

      {/* Unacknowledged alerts first */}
      {unacked.map((alert) => (
        <div
          key={alert.id}
          className="rounded-xl border border-orange-200 bg-orange-50 px-5 py-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={severityBadge[alert.severity] ?? 'neutral'}>
                {alert.severity}
              </Badge>
              <span className="font-semibold text-lg text-brand-navy">
                {alertTypeLabel[alert.alert_type] ?? alert.alert_type}
              </span>
            </div>
            <p className="text-lg text-gray-700">{alert.message}</p>
            <p className="text-base text-gray-400">{formatAge(alert.created_at)}</p>
          </div>
          {familyMemberId && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleAcknowledge(alert.id)}
              loading={acknowledging === alert.id}
              className="shrink-0"
            >
              Mark acknowledged
            </Button>
          )}
        </div>
      ))}

      {/* Acknowledged alerts (collapsed) */}
      {acked.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-base text-gray-400 hover:text-gray-600">
            {acked.length} acknowledged alert{acked.length === 1 ? '' : 's'}
          </summary>
          <div className="mt-2 space-y-2">
            {acked.map((alert) => (
              <div
                key={alert.id}
                className="rounded-xl border border-gray-200 bg-white px-5 py-3 flex flex-wrap items-center gap-3 opacity-60"
              >
                <Badge variant={severityBadge[alert.severity] ?? 'neutral'}>
                  {alert.severity}
                </Badge>
                <span className="text-lg text-gray-600">
                  {alertTypeLabel[alert.alert_type] ?? alert.alert_type}
                </span>
                <span className="text-base text-gray-400 ml-auto">{formatAge(alert.created_at)}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
