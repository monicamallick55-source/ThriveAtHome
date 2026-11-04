/**
 * lib/retell/language-line.ts — G4.8 Language Line Bridge
 *
 * Provides the Retell dynamic variable injection and tool stub
 * for transferring a live call to a Language Line interpreter.
 *
 * How it works:
 *   1. When Grace (Retell agent) starts a call, we detect the member's
 *      preferred language from their profile.
 *   2. If non-English, we inject `language_line_enabled: true` and
 *      `interpreter_language: "<language>"` as dynamic variables.
 *   3. Grace's prompt includes conditional logic: if interpreter needed,
 *      offer to connect one. The member says yes → Grace calls
 *      `transfer_to_interpreter` tool.
 *   4. This module handles the tool call and returns the dial string
 *      Language Line uses (stub: returns a fake number until LLC + account formed).
 *
 * Language Line account setup blocked by LLC formation.
 * Stub returns a placeholder dial string so the tool is wired correctly.
 */

export type InterpreterLanguage = {
  code: string        // BCP-47 e.g. 'es', 'zh-cmn', 'vi', 'tl'
  name: string        // Display name
  llCode: string      // Language Line language code (stub)
}

/** Supported interpreter languages via Language Line */
export const INTERPRETER_LANGUAGES: InterpreterLanguage[] = [
  { code: 'es',     name: 'Spanish',    llCode: 'SPA' },
  { code: 'zh-cmn', name: 'Mandarin',   llCode: 'MAN' },
  { code: 'zh-yue', name: 'Cantonese',  llCode: 'CAN' },
  { code: 'vi',     name: 'Vietnamese', llCode: 'VIE' },
  { code: 'tl',     name: 'Tagalog',    llCode: 'TAG' },
  { code: 'ko',     name: 'Korean',     llCode: 'KOR' },
  { code: 'ru',     name: 'Russian',    llCode: 'RUS' },
  { code: 'ar',     name: 'Arabic',     llCode: 'ARA' },
  { code: 'fr',     name: 'French',     llCode: 'FRE' },
  { code: 'ht',     name: 'Haitian Creole', llCode: 'HAC' },
]

export function getInterpreterLanguage(bcp47Code: string): InterpreterLanguage | null {
  return INTERPRETER_LANGUAGES.find(
    (l) => l.code === bcp47Code || bcp47Code.startsWith(l.code)
  ) ?? null
}

/**
 * Build Retell dynamic variables for a call session.
 * Pass the member's preferred_language BCP-47 code.
 */
export function buildLanguageLineDynamicVars(preferredLanguage?: string | null): Record<string, unknown> {
  if (!preferredLanguage || preferredLanguage === 'en') {
    return {
      language_line_enabled: false,
      interpreter_language: null,
      interpreter_language_name: null,
    }
  }

  const lang = getInterpreterLanguage(preferredLanguage)
  if (!lang) {
    return {
      language_line_enabled: false,
      interpreter_language: null,
      interpreter_language_name: null,
    }
  }

  return {
    language_line_enabled: true,
    interpreter_language: lang.llCode,
    interpreter_language_name: lang.name,
  }
}

export type TransferToInterpreterResult = {
  success: boolean
  dial_string?: string
  message: string
  stub: boolean
}

/**
 * Handle the `transfer_to_interpreter` Retell tool call.
 *
 * Returns the dial string Grace should use to conference in the interpreter.
 * STUB: Language Line account not yet activated (blocked by LLC formation).
 *       Returns a placeholder response so the tool wiring is correct.
 */
export async function transferToInterpreter(params: {
  language_code: string   // Language Line LL code e.g. 'SPA'
  member_id?: string
  call_id?: string
}): Promise<TransferToInterpreterResult> {
  const { language_code, member_id, call_id } = params

  // TODO: Replace with real Language Line OPI (over-phone interpretation) API call
  // Language Line OPI dial flow:
  //   1. Dial Language Line access number: 1-800-752-6096
  //   2. Enter client ID (from Language Line account)
  //   3. Enter language code
  //   4. Conference interpreter into the call
  //
  // For Retell, the transfer uses a SIP URI or PSTN number returned here.

  const LANGUAGE_LINE_ACCESS_NUMBER = process.env.LANGUAGE_LINE_ACCESS_NUMBER ?? null
  const LANGUAGE_LINE_CLIENT_ID = process.env.LANGUAGE_LINE_CLIENT_ID ?? null

  if (!LANGUAGE_LINE_ACCESS_NUMBER || !LANGUAGE_LINE_CLIENT_ID) {
    // Stub mode — LLC not formed yet
    console.info('[LanguageLine] STUB: transfer_to_interpreter called', {
      language_code, member_id, call_id,
    })
    return {
      success: false,
      message: `Language Line interpreter service not yet activated. Please ask your navigator to arrange ${language_code} language support.`,
      stub: true,
    }
  }

  // Live mode (post-LLC): dial Language Line
  const dialString = `${LANGUAGE_LINE_ACCESS_NUMBER},${LANGUAGE_LINE_CLIENT_ID},${language_code}#`

  return {
    success: true,
    dial_string: dialString,
    message: `Connecting you to a ${language_code} interpreter. One moment please.`,
    stub: false,
  }
}
