import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import {
  getActiveSkills,
  getMemberSkills,
  getMemberCredits,
  getMemberTransactions,
  getMemberExchanges,
} from '@/lib/data/skill-exchange'
import SkillExchangeClient from '@/components/skill-exchange/SkillExchangeClient'

export const metadata: Metadata = { title: 'Skill Exchange — ThriveAtHome' }

export default async function SkillExchangePage() {
  const user = await requireAuth()
  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  const memberId = fm?.member_id ?? undefined

  const [allSkills, mySkills, credits, transactions, exchanges] = await Promise.all([
    getActiveSkills(),
    memberId ? getMemberSkills(memberId) : Promise.resolve([]),
    memberId ? getMemberCredits(memberId) : Promise.resolve(null),
    memberId ? getMemberTransactions(memberId) : Promise.resolve([]),
    memberId ? getMemberExchanges(memberId) : Promise.resolve([]),
  ])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 40, backgroundColor: 'white',
        borderBottom: '1px solid var(--color-warm-grey)', boxShadow: 'var(--shadow-sm)',
        height: '64px', display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto', padding: '0 24px', width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link href="/dashboard" style={{
            fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 500,
            color: 'var(--color-text-secondary)', textDecoration: 'none',
          }}>
            ← Dashboard
          </Link>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-navy)', fontWeight: 500 }}>
            ThriveAtHome
          </span>
          <div style={{ width: '120px' }} aria-hidden="true" />
        </div>
      </nav>

      <SkillExchangeClient
        allSkills={allSkills}
        mySkills={mySkills}
        myCredits={credits}
        myTransactions={transactions}
        myExchanges={exchanges}
        hasMember={!!memberId}
      />
    </div>
  )
}
