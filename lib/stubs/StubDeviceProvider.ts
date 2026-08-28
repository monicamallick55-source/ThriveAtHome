// Stub implementation — logs device linking and voice briefings, performs no real
// integration. Replaced in M22 activation with Alexa Skills / Google Assistant Actions.
import type {
  DeviceProvider,
  DeviceLinkRequest,
  DeviceLinkResult,
  VoiceBriefingRequest,
} from '../interfaces/DeviceProvider'

export class StubDeviceProvider implements DeviceProvider {
  async linkAccount(req: DeviceLinkRequest): Promise<DeviceLinkResult> {
    console.log(
      `[STUB][Device] Would link ${req.deviceType} (${req.provider}) for member ${req.memberId}`
    )
    return { externalAccountId: `stub-device-${Date.now()}`, status: 'active' }
  }

  async unlinkAccount(externalAccountId: string): Promise<void> {
    console.log(`[STUB][Device] Would unlink device account ${externalAccountId}`)
  }

  async pushDailyBriefing(req: VoiceBriefingRequest): Promise<void> {
    console.log(
      `[STUB][Device] Would speak to ${req.preferredName} (member ${req.memberId}): "${req.lines.join(' ').slice(0, 140)}"`
    )
  }

  async getDeviceStatus(externalAccountId: string): Promise<'active' | 'disconnected' | 'error'> {
    console.log(`[STUB][Device] Would check status for ${externalAccountId}`)
    return 'active'
  }
}
