import { NextResponse } from 'next/server'
export const runtime = 'nodejs'
export async function GET() {
  return NextResponse.json({
    resourceType: 'CapabilityStatement',
    status: 'active',
    date: new Date().toISOString().slice(0, 10),
    kind: 'instance',
    fhirVersion: '4.0.1',
    format: ['application/fhir+json'],
    rest: [{
      mode: 'server',
      resource: [{ type: 'Patient', interaction: [{ code: 'read' }] }]
    }]
  }, { headers: { 'Content-Type': 'application/fhir+json' } })
}
