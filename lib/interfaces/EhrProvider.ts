// Interface for clinical data exchange via HL7 FHIR — Epic, Cerner, athenahealth,
// or any generic FHIR R4 endpoint. Used to push wellness observations and flagged
// conditions into a member's electronic health record with their consent.
// Real implementations are added in M22 activation once EHR credentials / BAAs exist.

export interface EhrConnectRequest {
  memberId: string
  /** epic | cerner | athenahealth | generic_fhir */
  ehrSystem: string
  fhirBaseUrl?: string
}

export interface EhrConnectResult {
  patientFhirId: string
  /** SMART-on-FHIR authorisation URL when required */
  authUrl?: string
  status: 'active' | 'pending'
}

export interface FhirObservationInput {
  code: string
  display: string
  value: number | string
  unit?: string
  effectiveDateTime: string
}

export interface FhirConditionInput {
  code: string
  display: string
  onsetDateTime: string
  clinicalStatus: 'active' | 'resolved'
}

export interface FhirExportResult {
  resourceType: 'Observation' | 'Condition' | 'Encounter'
  resourceCount: number
  status: 'stub' | 'success' | 'error'
  summary: string
}

export interface EhrProvider {
  connect(req: EhrConnectRequest): Promise<EhrConnectResult>
  revoke(patientFhirId: string): Promise<void>
  exportObservations(patientFhirId: string, observations: FhirObservationInput[]): Promise<FhirExportResult>
  exportConditions(patientFhirId: string, conditions: FhirConditionInput[]): Promise<FhirExportResult>
}
