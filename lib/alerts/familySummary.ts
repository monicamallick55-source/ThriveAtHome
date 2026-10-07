// Sends a daily call summary SMS to opted-in family members after processCallEnded.
// Never throws -- a failed SMS must not block the rest of call processing.
import { smsProvider } from '../providers'
import { toE164 } from '../voice/phone'

export interface FamilySmsResult {
  sentTo: number
  skipped: number
  errors: string[]
}

interface FamilyMemberRow {
  phone?: string | null
  sms_opted_in?: boolean | null
}

export async function sendFamilySummary(
  familyMembers: FamilyMemberRow[],
  memberName: string,
  agentName: string,
  summary: string,
  isCrisis: boolean,
): Promise<FamilySmsResult> {
  const result: FamilySmsResult = { sentTo: 0, skipped: 0, errors: [] }
  const hourUtc = new Date().getUTCHours()
  const inQuietHours = hourUtc >= 2 && hourUtc < 13
  if (inQuietHours && !isCrisis) { result.skipped = familyMembers.length; return result }
  const agentLabel = agentName === 'joy' ? 'Joy' : agentName === 'grace' ? 'Grace' : 'Aria'
  const prefix = isCrisis ? 'URGENT: ' : ''
  const body = prefix + agentLabel + ' just spoke with ' + memberName + '. ' + summary + ' -- ThriveAtHome'
  await Promise.all(familyMembers.map(async (fm) => {
    if (!fm.sms_opted_in || !fm.phone) { result.skipped++; return }
    const to = toE164(fm.phone)
    if (!to) { result.skipped++; return }
    try {
      if (isCrisis) { await smsProvider.sendUrgent(to, body) }
      else { await smsProvider.send(to, body) }
      result.sentTo++
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[familySummary] SMS failed:', msg)
      result.errors.push(msg)
      result.skipped++
    }
  }))
  return result
}
