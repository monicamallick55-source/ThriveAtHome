// Retell tool name → tool function. Used by the webhook and the /api/retell/tools/* routes.
import type { ToolArgs, ToolContext, ToolOutcome } from './types'
import { run as serviceRequest } from './serviceRequest'
import { run as welfareCheck } from './welfareCheck'
import { run as requestCallback } from './requestCallback'
import { run as logMoodScore } from './logMoodScore'
import { run as navigatorAlert } from './navigatorAlert'
import { run as updateCallPreferences } from './updateCallPreferences'

export type ToolFn = (args: ToolArgs, ctx: ToolContext) => Promise<ToolOutcome>

export const TOOLS: Record<string, ToolFn> = {
  create_service_request: serviceRequest,
  flag_welfare_concern: welfareCheck,
  request_callback: requestCallback,
  log_mood_score: logMoodScore,
  create_navigator_alert: navigatorAlert,
  update_call_preferences: updateCallPreferences,
}

export type { ToolArgs, ToolContext, ToolOutcome }
