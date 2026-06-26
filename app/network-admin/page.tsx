// Network Federation Admin Portal — Phase 66
// For VtVN, n4a, and other parent network accounts to manage member orgs and dues.
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth, getUserRole } from '@/lib/auth'
import { getNetworkForAdmin, getNetworkOrgs, getNetworkDues, getNetworkStats } from '@/lib/data/networks'
import NetworkAdminPortal from '@/components/network/NetworkAdminPortal'

export const metadata: Metadata = { title: 'Network Admin — ThriveAtHome' }

export default async function NetworkAdminPage() {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  if (role !== 'network_admin' && role !== 'admin') redirect('/dashboard')

  const { data: network, error: networkError } = await getNetworkForAdmin(user.id)
  if (!network || networkError) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)' }}>
        <div style={{ maxWidth: '480px', textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '20px' }}>🌐</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '16px' }}>Network Not Linked</h1>
          <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
            Your account is not linked to a network account. To set up network admin access:
          </p>
          <ol style={{ textAlign: 'left', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 2 }}>
            <li>Run migration 051_network_federation.sql in Supabase SQL Editor</li>
            <li>Note the UUID of the network (e.g. Village to Village Network)</li>
            <li>In family_members: set role=&apos;network_admin&apos; and network_id=[UUID] for your user</li>
          </ol>
        </div>
      </div>
    )
  }

  const year = new Date().getFullYear()
  const [orgsRes, duesRes, statsRes] = await Promise.all([
    getNetworkOrgs(network.id),
    getNetworkDues(network.id, year),
    getNetworkStats(network.id),
  ])

  return (
    <NetworkAdminPortal
      network={network}
      initialOrgs={orgsRes.data}
      initialDues={duesRes.data}
      stats={statsRes.data}
      currentYear={year}
    />
  )
}
