// THE ONE FILE that selects stub vs real for every external service.
// Application code imports from here ONLY — never from /lib/stubs/ or /lib/services/ directly.
// To add a real service: create its implementation in /lib/services/ and update the resolver below.
// Nothing else in the codebase changes.

import { StubCallProvider }      from './stubs/StubCallProvider'
import { StubSmsProvider }       from './stubs/StubSmsProvider'
import { StubEmailProvider }     from './stubs/StubEmailProvider'
import { StubAiProvider }        from './stubs/StubAiProvider'
import { StubBillingProvider }   from './stubs/StubBillingProvider'
import { StubTransportProvider } from './stubs/StubTransportProvider'
import { StubMealProvider }      from './stubs/StubMealProvider'
import { StubGoodsProvider }     from './stubs/StubGoodsProvider'
import { StubDeviceProvider }    from './stubs/StubDeviceProvider'
import { StubWearableProvider }  from './stubs/StubWearableProvider'
import { StubEhrProvider }       from './stubs/StubEhrProvider'
import { StubMlProvider }        from './stubs/StubMlProvider'
import type { CallProvider }     from './interfaces/CallProvider'
import type { SmsProvider }      from './interfaces/SmsProvider'
import type { EmailProvider }    from './interfaces/EmailProvider'
import type { AiProvider }       from './interfaces/AiProvider'
import type { BillingProvider }  from './interfaces/BillingProvider'
import type { TransportProvider } from './interfaces/TransportProvider'
import type { MealProvider }     from './interfaces/MealProvider'
import type { GoodsProvider }    from './interfaces/GoodsProvider'
import type { DeviceProvider }   from './interfaces/DeviceProvider'
import type { WearableProvider } from './interfaces/WearableProvider'
import type { EhrProvider }      from './interfaces/EhrProvider'
import type { MlProvider }       from './interfaces/MlProvider'

function resolveAiProvider(): AiProvider {
  if (process.env.ANTHROPIC_API_KEY) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AnthropicAiProvider } = require('./services/AnthropicAiProvider') // Added in M8
    return new AnthropicAiProvider()
  }
  return new StubAiProvider()
}
function resolveCallProvider(): CallProvider {
  if (process.env.RETELL_API_KEY && process.env.TWILIO_ACCOUNT_SID) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { RetellCallProvider } = require('./services/RetellCallProvider') // Added in M8
    return new RetellCallProvider()
  }
  return new StubCallProvider()
}
function resolveSmsProvider(): SmsProvider {
  if (process.env.TWILIO_ACCOUNT_SID) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { TwilioSmsProvider } = require('./services/TwilioSmsProvider') // Added in M10
    return new TwilioSmsProvider()
  }
  return new StubSmsProvider()
}
function resolveEmailProvider(): EmailProvider {
  if (process.env.SENDGRID_API_KEY) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SendGridEmailProvider } = require('./services/SendGridEmailProvider') // Added in M10
    return new SendGridEmailProvider()
  }
  return new StubEmailProvider()
}
function resolveBillingProvider(): BillingProvider {
  if (process.env.STRIPE_SECRET_KEY) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { StripeBillingProvider } = require('./services/StripeBillingProvider') // Added in M11
    return new StripeBillingProvider()
  }
  return new StubBillingProvider()
}
function resolveTransportProvider(): TransportProvider {
  if (process.env.LYFT_HEALTHCARE_API_KEY) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { LyftTransportProvider } = require('./services/LyftTransportProvider') // Added in M17
    return new LyftTransportProvider()
  }
  return new StubTransportProvider()
}
function resolveMealProvider(): MealProvider {
  if (process.env.INSTACART_API_KEY) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { InstacartMealProvider } = require('./services/InstacartMealProvider') // Added in M17
    return new InstacartMealProvider()
  }
  return new StubMealProvider()
}
function resolveGoodsProvider(): GoodsProvider {
  if (process.env.ONE800FLOWERS_API_KEY || process.env.ARTIFACT_UPRISING_API_KEY) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { RealGoodsProvider } = require('./services/RealGoodsProvider') // Added in M16
    return new RealGoodsProvider()
  }
  return new StubGoodsProvider()
}

function resolveDeviceProvider(): DeviceProvider {
  if (process.env.ALEXA_SKILL_ID || process.env.GOOGLE_ACTIONS_PROJECT_ID) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { RealDeviceProvider } = require('./services/RealDeviceProvider') // Added in M22 activation
    return new RealDeviceProvider()
  }
  return new StubDeviceProvider()
}
function resolveWearableProvider(): WearableProvider {
  if (process.env.FITBIT_CLIENT_ID || process.env.GARMIN_CONSUMER_KEY) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { RealWearableProvider } = require('./services/RealWearableProvider') // Added in M22 activation
    return new RealWearableProvider()
  }
  return new StubWearableProvider()
}
function resolveEhrProvider(): EhrProvider {
  if (process.env.EPIC_CLIENT_ID || process.env.CERNER_CLIENT_ID || process.env.FHIR_BASE_URL) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { RealEhrProvider } = require('./services/RealEhrProvider') // Added in M22 activation
    return new RealEhrProvider()
  }
  return new StubEhrProvider()
}
function resolveMlProvider(): MlProvider {
  if (process.env.ML_INFERENCE_URL) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { RealMlProvider } = require('./services/RealMlProvider') // Added in M23 activation
    return new RealMlProvider()
  }
  return new StubMlProvider()
}

export const aiProvider:        AiProvider        = resolveAiProvider()
export const callProvider:      CallProvider      = resolveCallProvider()
export const smsProvider:       SmsProvider       = resolveSmsProvider()
export const emailProvider:     EmailProvider     = resolveEmailProvider()
export const billingProvider:   BillingProvider   = resolveBillingProvider()
export const transportProvider: TransportProvider = resolveTransportProvider()
export const mealProvider:      MealProvider      = resolveMealProvider()
export const goodsProvider:     GoodsProvider     = resolveGoodsProvider()
export const deviceProvider:    DeviceProvider    = resolveDeviceProvider()
export const wearableProvider:  WearableProvider  = resolveWearableProvider()
export const ehrProvider:       EhrProvider       = resolveEhrProvider()
export const mlProvider:        MlProvider        = resolveMlProvider()
