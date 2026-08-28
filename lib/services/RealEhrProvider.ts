// Placeholder for the real HL7 FHIR / EHR integration (Epic, Cerner, generic
// FHIR R4). Wired up during M22 activation once BAAs and SMART-on-FHIR client
// credentials are in place. Throws a clear error so a half-configured
// environment fails loudly instead of silently behaving like the stub.
import type { EhrProvider } from '../interfaces/EhrProvider'

const NOT_READY =
  'RealEhrProvider is not implemented yet. Remove EPIC_CLIENT_ID / CERNER_CLIENT_ID / ' +
  'FHIR_BASE_URL to fall back to the stub, or complete M22 activation.'

export class RealEhrProvider implements EhrProvider {
  constructor() {
    throw new Error(NOT_READY)
  }
  connect(): never {
    throw new Error(NOT_READY)
  }
  revoke(): never {
    throw new Error(NOT_READY)
  }
  exportObservations(): never {
    throw new Error(NOT_READY)
  }
  exportConditions(): never {
    throw new Error(NOT_READY)
  }
}
