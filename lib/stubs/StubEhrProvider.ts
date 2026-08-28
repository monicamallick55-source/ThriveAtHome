// Stub implementation — logs FHIR exports, performs no real EHR write.
// Replaced in M22 activation with Epic / Cerner / generic FHIR R4 clients
// once BAAs and SMART-on-FHIR credentials are in place.
import type {
  EhrProvider,
  EhrConnectRequest,
  EhrConnectResult,
  FhirObservationInput,
  FhirConditionInput,
  FhirExportResult,
} from '../interfaces/EhrProvider'

export class StubEhrProvider implements EhrProvider {
  async connect(req: EhrConnectRequest): Promise<EhrConnectResult> {
    console.log(
      `[STUB][EHR] Would connect member ${req.memberId} to ${req.ehrSystem}${req.fhirBaseUrl ? ` at ${req.fhirBaseUrl}` : ''}`
    )
    return { patientFhirId: `stub-patient-${Date.now()}`, status: 'active' }
  }

  async revoke(patientFhirId: string): Promise<void> {
    console.log(`[STUB][EHR] Would revoke FHIR access for ${patientFhirId}`)
  }

  async exportObservations(
    patientFhirId: string,
    observations: FhirObservationInput[]
  ): Promise<FhirExportResult> {
    console.log(
      `[STUB][EHR] Would POST ${observations.length} FHIR Observation(s) for ${patientFhirId}`
    )
    return {
      resourceType: 'Observation',
      resourceCount: observations.length,
      status: 'stub',
      summary: `${observations.length} wellness observations mapped to FHIR R4 Observation resources`,
    }
  }

  async exportConditions(
    patientFhirId: string,
    conditions: FhirConditionInput[]
  ): Promise<FhirExportResult> {
    console.log(
      `[STUB][EHR] Would POST ${conditions.length} FHIR Condition(s) for ${patientFhirId}`
    )
    return {
      resourceType: 'Condition',
      resourceCount: conditions.length,
      status: 'stub',
      summary: `${conditions.length} flagged conditions mapped to FHIR R4 Condition resources`,
    }
  }
}
