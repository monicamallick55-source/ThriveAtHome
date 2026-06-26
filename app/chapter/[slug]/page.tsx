import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublicOrgBySlug, getPublicOrgPrograms } from '@/lib/data/communityOrgs'
import ChapterLandingClient from '@/components/public/ChapterLandingClient'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { data: org } = await getPublicOrgBySlug(slug)
  if (!org) return { title: 'Chapter — ThriveAtHome' }
  return {
    title: `${org.org_name} — ThriveAtHome Chapter`,
    description: org.description ?? `Join ${org.org_name}, a local ThriveAtHome chapter helping seniors thrive at home.`,
    openGraph: {
      title: `${org.org_name} — ThriveAtHome`,
      description: org.description ?? `Join ${org.org_name}, a local ThriveAtHome chapter helping seniors thrive at home.`,
      type: 'website',
    },
  }
}

export default async function ChapterPage({ params }: Props) {
  const { slug } = await params
  const [{ data: org }, ] = await Promise.all([getPublicOrgBySlug(slug)])
  if (!org) notFound()

  const { data: programs } = await getPublicOrgPrograms(org.id)

  return <ChapterLandingClient org={org} programs={programs ?? []} />
}
