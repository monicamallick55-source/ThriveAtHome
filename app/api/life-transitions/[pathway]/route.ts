import { NextResponse } from 'next/server'

const PATHWAY_DATA: Record<string, { name: string; icon: string; steps: string[] }> = {
  retirement: { name: 'Retirement', icon: '🏖️', steps: ['Review benefits', 'Set up income plan', 'Explore activities'] },
  widow: { name: 'Loss of Spouse', icon: '🕊️', steps: ['Grief support', 'Legal & financial review', 'Community connection'] },
  diagnosis: { name: 'New Diagnosis', icon: '🏥', steps: ['Care team setup', 'Benefits review', 'Support network'] },
  moving: { name: 'Moving', icon: '🏠', steps: ['Housing options', 'Community connection', 'Service transfer'] },
  caregiving: { name: 'Caregiving', icon: '🤝', steps: ['Respite care', 'Resources', 'Support groups'] },
  divorce: { name: 'Divorce', icon: '⚖️', steps: ['Legal guidance', 'Financial review', 'Emotional support'] },
  loss: { name: 'Loss of Loved One', icon: '💙', steps: ['Grief resources', 'Estate basics', 'Community support'] },
  financial: { name: 'Financial Change', icon: '💼', steps: ['Benefits review', 'Connect with advisor', 'Explore assistance programs'] },
  independence: { name: 'Independence', icon: '🌟', steps: ['Home safety', 'Support services', 'Community programs'] },
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pathway: string }> }
) {
  const { pathway } = await params
  const data = PATHWAY_DATA[pathway]
  if (!data) return NextResponse.json({ error: 'Unknown pathway' }, { status: 404 })
  return NextResponse.json({ pathway, ...data })
}
