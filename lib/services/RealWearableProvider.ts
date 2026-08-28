// Placeholder for the real wearable integration (Fitbit, Garmin, Apple HealthKit,
// Google Fit). Wired up during M22 activation once developer credentials exist.
// Throws a clear error so a half-configured environment fails loudly.
import type { WearableProvider } from '../interfaces/WearableProvider'

const NOT_READY =
  'RealWearableProvider is not implemented yet. Remove FITBIT_CLIENT_ID / ' +
  'GARMIN_CONSUMER_KEY to fall back to the stub, or complete M22 activation.'

export class RealWearableProvider implements WearableProvider {
  constructor() {
    throw new Error(NOT_READY)
  }
  connect(): never {
    throw new Error(NOT_READY)
  }
  disconnect(): never {
    throw new Error(NOT_READY)
  }
  syncReadings(): never {
    throw new Error(NOT_READY)
  }
}
