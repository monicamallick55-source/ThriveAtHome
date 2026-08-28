// Interface for companion devices, voice assistants (Alexa Skills, Google Assistant
// Actions), and smart-home hubs (Echo, Nest, Ring, ADT, Philips Hue, GrandPad).
// Real implementations are added in M22 activation once partner credentials exist.

export interface DeviceLinkRequest {
  memberId: string
  /** alexa | google_assistant | echo_show | nest_hub | ring_doorbell | adt_hub | philips_hue | grandpad | thrive_tablet | motion_sensor */
  deviceType: string
  /** amazon | google | ring | adt | signify | grandpad | thriveathome */
  provider: string
}

export interface DeviceLinkResult {
  externalAccountId: string
  /** URL the family member visits to finish OAuth linking, when applicable */
  linkUrl?: string
  status: 'active' | 'pending'
}

export interface VoiceBriefingRequest {
  memberId: string
  preferredName: string
  /** Short spoken lines the assistant should read to the member */
  lines: string[]
}

export interface DeviceProvider {
  /** Begin (or complete) account linking for a voice assistant or smart-home hub. */
  linkAccount(req: DeviceLinkRequest): Promise<DeviceLinkResult>
  /** Remove the link and revoke tokens. */
  unlinkAccount(externalAccountId: string): Promise<void>
  /** Push a spoken daily briefing to the member's voice assistant / tablet. */
  pushDailyBriefing(req: VoiceBriefingRequest): Promise<void>
  /** Current reachability of a linked device. */
  getDeviceStatus(externalAccountId: string): Promise<'active' | 'disconnected' | 'error'>
}
