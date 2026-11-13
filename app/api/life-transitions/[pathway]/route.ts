import { NextRequest, NextResponse } from 'next/server'

const PATHWAYS = ['retirement','widow','diagnosis','moving','caregiving','divorce','loss','financial','independence']

const PATHWAY_DATA: Record<string, { name: string; steps: string[] }> = {
  retirement:   { name: 'Retirement Transition', steps: ['Review finances', 'Plan daily routine', 'Stay socially connected'] },
  widow:        { name: 'Loss of Spouse/Partner', steps: ['Grief support', 'Legal/financial steps', 'Build support network'] },
  diagnosis:    { name: 'Major Health Diagnosis', steps: ['Understand diagnosis', 'Build care team', 'Plan for changes'] },
  moving:       { name: 'Moving or Downsizing', steps: ['Sort belongings', 'Find new home', 'Connect with community'] },
  caregiving:   { name: 'Becoming a Caregiver', steps: ['Assess care needs', 'Find resources', 'Practice self-care'] },
  divorce:      { name: 'Late-Life Divorce', steps: ['Legal guidance', 'Financial planning', 'Emotional support'] },
  loss:         { name: 'Loss of a Loved One', steps: ['Grief counseling', 'Practical affairs', 'Community support'] },
  financial:    { name: 'Financial Change', steps: ['Budget review', 'Benefits check', 'Financial advisor'] },
  independence: { name: 'Maintaining Independence', steps: ['Home safety', 'Transportation options', 'Support services'] },
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ pathway: string }> }
) {
  const { pathway } = await params
  if (!PATHWAYS.includes(pathway)) {
    return NextResponse.json({ error: 'Unknown pathway' }, { status: 404 })
  }
  const data = PATHWAY_DATA[pathway]
  return NextResponse.json({
    pathway,
    name: data.name,
    steps: data.steps,
    title: data.name,
    resources: [],
    aria_arc: pathway,
    support_groups: [],
    status: 'active'
  })
}
