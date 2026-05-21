// MemberCard — shows the senior's name, status dot, and plan tier in the dashboard header.
import type { Member } from '@/lib/data/members'
import { StatusDot } from '@/components/ui/StatusDot'
import { Badge } from '@/components/ui/Badge'
import type { StatusLevel } from '@/components/ui/StatusDot'
import type { BadgeVariant } from '@/components/ui/Badge'

const planLabels: Record<string, string> = {
  basics: 'Basics',
  connect: 'Connect',
  complete: 'Complete',
  premier: 'Premier',
}

const statusLevelMap: Record<string, StatusLevel> = {
  active: 'no_alerts',
  inactive: 'informational',
  paused: 'concern',
}

const planVariant: Record<string, BadgeVariant> = {
  basics: 'neutral',
  connect: 'info',
  complete: 'success',
  premier: 'urgent',
}

export interface MemberCardProps {
  member: Member
}

export function MemberCard({ member }: MemberCardProps) {
  const statusLevel = statusLevelMap[member.status] ?? 'informational'

  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <StatusDot level={statusLevel} size="lg" />
        <div>
          <h1 className="text-3xl font-bold text-brand-navy leading-tight">
            {member.preferred_name}&apos;s Dashboard
          </h1>
          <p className="text-lg text-gray-500">{member.full_name}</p>
        </div>
      </div>
      <Badge variant={planVariant[member.plan_tier] ?? 'neutral'}>
        {planLabels[member.plan_tier] ?? member.plan_tier} Plan
      </Badge>
    </div>
  )
}
