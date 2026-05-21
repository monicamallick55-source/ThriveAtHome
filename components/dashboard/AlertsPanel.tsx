'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { SectionError } from './SectionError'
import type { Alert } from '@/lib/data/alerts'
import type { StatusLevel } from '@/components/ui/StatusDot'

const alertTypeLabel: Record<string, string> = {
  missed_call: 'Aria noticed a missed call',
  mood_drop: 'Aria noticed a mood concern',
  medication_miss: 'Medication may have been missed',
  wellness_drift: 'Wellness has been gradually declining',
  fall: 'A possible fall was detected',
  crisis: 'Crisis keywords detected — please check in',
  emergency: 'Emergency — immediate attention needed',
}

const severityStyle: Record<string, { border: string; bg: string; badge: string; badgeText: string; label: string }> = {
  informational: {
    border: 'var(--color-navy-light)',
    bg: 'var(--color-info)',
    badge: 'var(--color-info)',
    badgeText: 'var(--color-info-text)',
    label: 'Note',
  },
  concern: {
    border: 'var(--color-concern-border)',
    bg: 'var(--color-concern)',
    badge: 'var(--color-concern)',
    badgeText: 'var(--color-concern-text)',
    label: 'Attention',
  },
  urgent: {
    border: 'var(--color-urgent-border)',
    bg: 'var(--color-urgent)',
    badge: 'var(--color-urgent)',
    badgeText: 'var(--color-urgent-text)',
    label: 'Urgent',
  },
  emergency: {
    border: 'var(--color-urgent-border)',
    bg: 'var(--color-emergency)',
    badge: 'var(--color-emergency)',
    badgeText: 'white',
    label: 'Emergency',
  },
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

  if (unacked.length === 0 && acked.length === 0) {
    return (
      <div
        style={{
          backgroundColor: 'var(--color-teal-muted)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          minHeight: '80px',
        }}
      >
        <span style={{ fontSize: '28px' }}>✓</span>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '22px',
            color: 'var(--color-teal)',
            margin: 0,
          }}
        >
          No concerns this week. Everything looks good.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {unacked.map((alert) => {
        const style = severityStyle[alert.severity] ?? severityStyle.concern
        const isEmergency = alert.severity === 'emergency'
        return (
          <div
            key={alert.id}
            style={{
              backgroundColor: style.bg,
              borderLeft: `4px solid ${style.border}`,
              border: `1px solid ${style.border}`,
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      backgroundColor: style.badge,
                      color: style.badgeText,
                      fontSize: '13px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-body)',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {style.label}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13px',
                      color: isEmergency ? 'rgba(255,255,255,0.6)' : 'var(--color-text-muted)',
                    }}
                  >
                    {formatAge(alert.created_at)}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '18px',
                    color: isEmergency ? 'white' : 'var(--color-text-primary)',
                    margin: 0,
                    lineHeight: 1.65,
                  }}
                >
                  {alertTypeLabel[alert.alert_type] ?? alert.message}
                </p>
                {alert.message && alert.message !== alertTypeLabel[alert.alert_type] && (
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '15px',
                      color: isEmergency ? 'rgba(255,255,255,0.8)' : 'var(--color-text-secondary)',
                      margin: '8px 0 0',
                    }}
                  >
                    {alert.message}
                  </p>
                )}
              </div>
              {familyMemberId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAcknowledge(alert.id)}
                  loading={acknowledging === alert.id}
                  style={{ flexShrink: 0 }}
                >
                  Mark acknowledged
                </Button>
              )}
            </div>
          </div>
        )
      })}

      {acked.length > 0 && (
        <details style={{ marginTop: '8px' }}>
          <summary
            style={{
              cursor: 'pointer',
              fontSize: '15px',
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-body)',
              padding: '8px 0',
            }}
          >
            {acked.length} acknowledged alert{acked.length === 1 ? '' : 's'}
          </summary>
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {acked.map((alert) => {
              const style = severityStyle[alert.severity] ?? severityStyle.concern
              return (
                <div
                  key={alert.id}
                  style={{
                    backgroundColor: 'var(--color-warm-white)',
                    border: '1px solid var(--color-warm-grey)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    opacity: 0.7,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      backgroundColor: style.badge,
                      color: style.badgeText,
                      fontSize: '11px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-body)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    {style.label}
                  </span>
                  <span style={{ fontSize: '18px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', flex: 1 }}>
                    {alertTypeLabel[alert.alert_type] ?? alert.alert_type}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {formatAge(alert.created_at)}
                  </span>
                </div>
              )
            })}
          </div>
        </details>
      )}
    </div>
  )
}
