#!/bin/bash
set -e
cd /workspaces/ThriveAtHome

mkdir -p components app/dashboard/support app/org-admin/support app/admin/support app/api/support/ticket app/api/admin/support "app/api/admin/support/[id]"

echo "Creating files..."

# 1. SupportWidget component
cat > components/SupportWidget.tsx << 'EOF'
'use client'

type SupportVariant = 'member' | 'family' | 'b2b' | 'navigator' | 'volunteer'
interface SupportWidgetProps { variant: SupportVariant; orgName?: string; compact?: boolean }

const PHONE = {
  rosa:   process.env.NEXT_PUBLIC_PHONE_ROSA   ?? '1-800-TAH-CARE',
  quinn:  process.env.NEXT_PUBLIC_PHONE_QUINN  ?? '1-800-TAH-24HR',
  hope:   process.env.NEXT_PUBLIC_PHONE_HOPE   ?? '1-800-TAH-HOPE',
  claire: process.env.NEXT_PUBLIC_PHONE_CLAIRE ?? '1-800-TAH-FMLY',
  jordan: process.env.NEXT_PUBLIC_PHONE_JORDAN ?? '1-800-TAH-B2BP',
  sam:    process.env.NEXT_PUBLIC_PHONE_SAM    ?? '1-800-TAH-VOLV',
  nova:   process.env.NEXT_PUBLIC_PHONE_NOVA   ?? '1-800-TAH-NAVR',
}

type AgentLine = { name: string; label: string; phone: string; color: string; hours: string; emoji: string }

const AGENTS_BY_VARIANT: Record<SupportVariant, AgentLine[]> = {
  member:    [
    { name: 'Rosa',  label: 'Care Line',      phone: PHONE.rosa,  color: '#10b981', hours: 'Mon–Fri 8am–8pm', emoji: '🌿' },
    { name: 'Quinn', label: '24/7 Concierge', phone: PHONE.quinn, color: '#6366f1', hours: 'Always open',      emoji: '✨' },
    { name: 'Hope',  label: 'Crisis Support', phone: PHONE.hope,  color: '#ef4444', hours: 'Always open',      emoji: '🤝' },
  ],
  family:    [
    { name: 'Claire', label: 'Family Support', phone: PHONE.claire, color: '#8b5cf6', hours: 'Mon–Fri 8am–8pm', emoji: '💜' },
    { name: 'Quinn',  label: '24/7 Concierge', phone: PHONE.quinn,  color: '#6366f1', hours: 'Always open',     emoji: '✨' },
    { name: 'Hope',   label: 'Crisis Support', phone: PHONE.hope,   color: '#ef4444', hours: 'Always open',     emoji: '🤝' },
  ],
  b2b:       [
    { name: 'Jordan', label: 'Partner Support', phone: PHONE.jordan, color: '#6366f1', hours: 'Mon–Fri 8am–6pm PT', emoji: '💼' },
    { name: 'Quinn',  label: '24/7 Concierge',  phone: PHONE.quinn,  color: '#10b981', hours: 'Always open',         emoji: '✨' },
  ],
  navigator: [
    { name: 'Nova',  label: 'Navigator Assist', phone: PHONE.nova,  color: '#6366f1', hours: 'Mon–Fri 8am–6pm', emoji: '🔭' },
    { name: 'Quinn', label: '24/7 Concierge',   phone: PHONE.quinn, color: '#10b981', hours: 'Always open',      emoji: '✨' },
  ],
  volunteer: [
    { name: 'Sam',   label: 'Volunteer Support', phone: PHONE.sam,   color: '#f59e0b', hours: 'Mon–Fri 9am–5pm', emoji: '🌟' },
    { name: 'Quinn', label: '24/7 Concierge',    phone: PHONE.quinn, color: '#6366f1', hours: 'Always open',      emoji: '✨' },
  ],
}

const TICKET_LABEL: Record<SupportVariant, string> = {
  member: 'Submit a request', family: 'Submit a request', b2b: 'Submit a support ticket',
  navigator: 'Submit a request', volunteer: 'Submit a request',
}

export default function SupportWidget({ variant, orgName, compact = false }: SupportWidgetProps) {
  const agents = AGENTS_BY_VARIANT[variant]
  const isB2B = variant === 'b2b'
  const containerStyle: React.CSSProperties = compact
    ? { border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 20px', background: '#fafafa', marginTop: 24 }
    : { border: '1px solid #e5e7eb', borderRadius: 16, padding: '20px 22px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }
  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: isB2B ? '#ede9fe' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
          {isB2B ? '💼' : '🤝'}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1f2937' }}>{isB2B ? 'Partner Support' : 'Need Help?'}</div>
          {orgName && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{orgName}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {agents.map(agent => (
          <div key={agent.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: '#f9fafb', border: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: agent.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1f2937' }}>{agent.emoji} {agent.name} — {agent.label}</div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 1 }}>{agent.hours}</div>
              </div>
            </div>
            <a href={`tel:${agent.phone.replace(/[^0-9+]/g, '')}`} style={{ fontSize: '0.78rem', fontWeight: 700, color: agent.color, textDecoration: 'none', whiteSpace: 'nowrap', padding: '4px 10px', border: `1px solid ${agent.color}`, borderRadius: 6, background: 'white' }}>
              {agent.phone}
            </a>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 14 }}>
        <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 10 }}>
          {isB2B ? "Can't call right now? Submit a ticket and we'll respond within 24 hours." : "Prefer to write? Submit a request and we'll follow up."}
        </div>
        <a href={isB2B ? '/org-admin/support' : '/dashboard/support'} style={{ display: 'block', textAlign: 'center', padding: '9px 16px', borderRadius: 8, background: '#6366f1', color: '#fff', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none' }}>
          {TICKET_LABEL[variant]}
        </a>
      </div>
    </div>
  )
}
EOF

echo "✓ SupportWidget.tsx"
