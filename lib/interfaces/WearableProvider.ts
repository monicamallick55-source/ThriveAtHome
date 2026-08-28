// Interface for wearable / health-data integrations:
// Apple HealthKit, Google Fit, Fitbit, Garmin.
// Real implementations are added in M22 activation once partner credentials exist.

export interface WearableConnectRequest {
  memberId: string
  /** apple_healthkit | google_fit | fitbit | garmin */
  platform: string
  scopes: string[]
}

export interface WearableConnectResult {
  externalUserId: string
  /** OAuth consent URL when the platform requires a browser step */
  authUrl?: string
  status: 'active' | 'pending'
}

export interface WearableDailyReading {
  readingDate: string
  steps: number | null
  restingHeartRate: number | null
  sleepHours: number | null
  activeMinutes: number | null
  fallDetected: boolean
}

export interface WearableProvider {
  connect(req: WearableConnectRequest): Promise<WearableConnectResult>
  disconnect(externalUserId: string): Promise<void>
  /** Pull the most recent daily readings (newest first). */
  syncReadings(externalUserId: string, sinceDate: string): Promise<WearableDailyReading[]>
}
