// Placeholder for the real voice-assistant / smart-home integration.
// Wired up during M22 activation once Alexa Skill / Google Assistant Action
// credentials and partner agreements are in place. Until then this throws a
// clear error so a half-configured environment fails loudly instead of silently
// behaving like the stub.
import type { DeviceProvider } from '../interfaces/DeviceProvider'

const NOT_READY =
  'RealDeviceProvider is not implemented yet. Remove ALEXA_SKILL_ID / ' +
  'GOOGLE_ACTIONS_PROJECT_ID to fall back to the stub, or complete M22 activation.'

export class RealDeviceProvider implements DeviceProvider {
  constructor() {
    throw new Error(NOT_READY)
  }
  linkAccount(): never {
    throw new Error(NOT_READY)
  }
  unlinkAccount(): never {
    throw new Error(NOT_READY)
  }
  pushDailyBriefing(): never {
    throw new Error(NOT_READY)
  }
  getDeviceStatus(): never {
    throw new Error(NOT_READY)
  }
}
