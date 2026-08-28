// Stub implementation — logs wearable connections and returns deterministic sample
// readings. Replaced in M22 activation with Fitbit / Garmin / HealthKit / Google Fit.
import type {
  WearableProvider,
  WearableConnectRequest,
  WearableConnectResult,
  WearableDailyReading,
} from '../interfaces/WearableProvider'

export class StubWearableProvider implements WearableProvider {
  async connect(req: WearableConnectRequest): Promise<WearableConnectResult> {
    console.log(
      `[STUB][Wearable] Would connect ${req.platform} for member ${req.memberId} (scopes: ${req.scopes.join(',') || 'default'})`
    )
    return { externalUserId: `stub-wearable-${Date.now()}`, status: 'active' }
  }

  async disconnect(externalUserId: string): Promise<void> {
    console.log(`[STUB][Wearable] Would disconnect ${externalUserId}`)
  }

  async syncReadings(externalUserId: string, sinceDate: string): Promise<WearableDailyReading[]> {
    console.log(`[STUB][Wearable] Would sync readings for ${externalUserId} since ${sinceDate}`)
    const today = new Date().toISOString().slice(0, 10)
    return [
      {
        readingDate: today,
        steps: 3200,
        restingHeartRate: 68,
        sleepHours: 6.5,
        activeMinutes: 22,
        fallDetected: false,
      },
    ]
  }
}
