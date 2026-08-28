// Placeholder for the real ML inference layer (sentiment NLP, Isolation Forest,
// XGBoost fall-risk, PGD assessment). Wired up during M23 activation once a
// model-serving endpoint (ML_INFERENCE_URL) and trained models exist. Until then
// this throws a clear error so a half-configured environment fails loudly
// instead of silently behaving like the heuristic stub.
import type { MlProvider } from '../interfaces/MlProvider'

const NOT_READY =
  'RealMlProvider is not implemented yet. Unset ML_INFERENCE_URL to fall back to ' +
  'the deterministic heuristic stub, or complete M23 activation.'

export class RealMlProvider implements MlProvider {
  constructor() {
    throw new Error(NOT_READY)
  }
  analyzeSentiment(): never {
    throw new Error(NOT_READY)
  }
  scoreBehavioralAnomaly(): never {
    throw new Error(NOT_READY)
  }
  predictFallRisk(): never {
    throw new Error(NOT_READY)
  }
  assessGriefPattern(): never {
    throw new Error(NOT_READY)
  }
}
