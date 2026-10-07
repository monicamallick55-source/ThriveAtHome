import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import EmployerLandingClient from '@/components/public/EmployerLandingClient'

interface EmployerPublic {
  id: string
  company_name: string
  slug: string | null
  description: string | null
  website_url: string | null
  benefit_headline: string | null
  benefit_description: string | null
  plan_tier: string
  contact_email: string
  contact_name: string
}

async function getEmployerBySlug(slug: string): Promise<EmployerPublic | null> {
  const admin = createAdminClient()
  const { data } = await (admin.from as any)('employer_accounts')
    .select('id, company_name, slug, description, website_url, benefit_headline, benefit_description, plan_tier, contact_email, contact_name')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle() as unknown as { data: EmployerPublic | null; error: unknown }
  return data
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const employer = await getEmployerBySlug(slug)
  if (!employer) return { title: 'Employer Benefits — ThriveAtHome' }
  const headline = employer.benefit_headline ?? `${employer.company_name} Employee Benefit`
  return {
    title: `${employer.company_name} × ThriveAtHome`,
    description: employer.benefit_description ?? `${employer.company_name} provides ThriveAtHome as an employee benefit — senior care coordination for your family.`,
    openGraph: {
      title: `${employer.company_name} × ThriveAtHome`,
      description: headline,
      type: 'website',
    },
  }
}

export default async function EmployerLandingPage({ params }: Props) {
  const { slug } = await params
  const employer = await getEmployerBySlug(slug)
  if (!employer) notFound()
  return <EmployerLandingClient employer={(employer ?? []) as any} />
}
