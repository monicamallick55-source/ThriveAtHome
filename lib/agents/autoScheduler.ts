/**
 * autoScheduler — decides which service requests can be auto-confirmed
 * and which need human navigator review.
 *
 * Design principle: navigators are alerted ONLY when automation cannot
 * safely complete the booking. Every routine, predictable request is
 * auto-confirmed so members get an instant answer.
 *
 * ─── FLOW ──────────────────────────────────────────────────────────────
 *  1. Service request arrives (web UI, voice call, recurring cron, API)
 *  2. autoScheduler.classify(request) → { route: 'auto' | 'review', reason }
 *  3. If 'auto':   mark booking confirmed + SMS/call member
 *  4. If 'review': create navigator_task + notify member "we'll be in touch"
 *
 * ─── AUTO RULES (no navigator needed) ────────────────────────────────
 *  • transport        — always auto-dispatched via transportProvider
 *  • meals            — always auto-confirmed
 *  • companionship    — auto-confirmed when companion_id already matched
 *  • recurring        — always auto-confirmed (member already approved cadence)
 *  • home_service     — auto-confirmed for routine subtypes
 *
 * ─── REVIEW RULES (navigator must action) ─────────────────────────────
 *  • urgency = 'urgent'          — any type
 *  • telehealth/mental_health    — always human
 *  • tech_help                   — needs volunteer coordination
 *  • travel_assistance           — needs companion matching or agent
 *  • roadside                    — needs emergency coordination
 *  • legal_financial             — always human
 *  • companionship, no match     — needs companion matching first
 *  • first booking of any type   — give navigator a heads-up
 */

export type ServiceType =
  | 'transport' | 'meals' | 'companionship' | 'companion'
  | 'home_service' | 'tech_help' | 'telehealth' | 'legal_financial'
  | 'travel_assistance' | 'roadside'

export type AutoRoute = 'auto' | 'review'

export interface AutoScheduleInput {
  serviceType:   ServiceType
  subtype?:      string
  urgency?:      'routine' | 'urgent'
  isRecurring?:  boolean
  hasMatchedId?: boolean   // e.g. companion_id already resolved
  isFirstBooking?: boolean // first time member has used this service type
  voiceSource?:  boolean   // came from a Retell call
}

export interface AutoScheduleResult {
  route:   AutoRoute
  reason:  string
  /** navigator task priority when route = 'review' */
  priority?: 'low' | 'medium' | 'high' | 'critical'
  /** Grace call type to fire after auto-confirm, if any */
  confirmationCall?: 'reminder'
}

// ─── Subtypes that are "routine" for home_service ────────────────────
const ROUTINE_HOME_SERVICE_SUBTYPES = new Set([
  'light_housekeeping', 'grocery_pickup', 'laundry', 'yard_work', 'errands',
  'pet_care', 'prescription_pickup',
])

export function classify(input: AutoScheduleInput): AutoScheduleResult {
  const { serviceType, subtype, urgency, isRecurring, hasMatchedId, isFirstBooking, voiceSource } = input

  // ─── 0. Urgency gate — always escalate ────────────────────────────
  if (urgency === 'urgent') {
    return {
      route: 'review',
      reason: 'Urgent request — navigator needs to act immediately.',
      priority: 'critical',
    }
  }

  // ─── 1. Recurring bookings — always auto ──────────────────────────
  if (isRecurring) {
    return {
      route: 'auto',
      reason: 'Recurring schedule auto-confirmed — member approved this cadence.',
      confirmationCall: 'reminder',
    }
  }

  // ─── 2. Transport — auto-dispatch ─────────────────────────────────
  if (serviceType === 'transport') {
    return {
      route: 'auto',
      reason: 'Transport auto-dispatched via provider. SMS confirmation sent.',
      confirmationCall: 'reminder',
    }
  }

  // ─── 3. Meals — auto-confirm ──────────────────────────────────────
  if (serviceType === 'meals') {
    return {
      route: 'auto',
      reason: 'Meal delivery auto-confirmed.',
    }
  }

  // ─── 4. Companionship / companion ────────────────────────────────
  if (serviceType === 'companionship' || serviceType === 'companion') {
    if (hasMatchedId) {
      return {
        route: 'auto',
        reason: 'Companion already matched — visit auto-confirmed.',
        confirmationCall: 'reminder',
      }
    }
    return {
      route: 'review',
      reason: 'No companion matched yet — navigator will find the right person.',
      priority: 'medium',
    }
  }

  // ─── 5. Home service ─────────────────────────────────────────────
  if (serviceType === 'home_service') {
    if (subtype && ROUTINE_HOME_SERVICE_SUBTYPES.has(subtype)) {
      return {
        route: isFirstBooking ? 'review' : 'auto',
        reason: isFirstBooking
          ? 'First home service — navigator confirms provider before auto-routing future requests.'
          : `Routine home service (${subtype}) auto-confirmed.`,
        priority: isFirstBooking ? 'low' : undefined,
        confirmationCall: isFirstBooking ? undefined : 'reminder',
      }
    }
    // Non-routine home service (e.g. handyman, renovation) — always review
    return {
      route: 'review',
      reason: `Home service subtype "${subtype ?? 'unspecified'}" needs navigator to vet provider.`,
      priority: 'medium',
    }
  }

  // ─── 6. Tech help — review (volunteer coordination needed) ────────
  if (serviceType === 'tech_help') {
    return {
      route: 'review',
      reason: 'Tech help needs a matched volunteer or in-home helper.',
      priority: 'medium',
    }
  }

  // ─── 7. Telehealth — mental health always human ───────────────────
  if (serviceType === 'telehealth') {
    if (subtype === 'mental_health_companion' || subtype === 'counselling') {
      return {
        route: 'review',
        reason: 'Mental health support requires a warm human referral.',
        priority: 'high',
      }
    }
    // Routine telehealth — review with lower priority
    return {
      route: 'review',
      reason: 'Telehealth request — navigator will coordinate with healthcare provider.',
      priority: 'medium',
    }
  }

  // ─── 8. Travel assistance ─────────────────────────────────────────
  if (serviceType === 'travel_assistance') {
    return {
      route: 'review',
      reason: 'Travel assistance requires navigator to match companion or travel agent.',
      priority: subtype === 'travel_companion' ? 'medium' : 'low',
    }
  }

  // ─── 9. Roadside ─────────────────────────────────────────────────
  if (serviceType === 'roadside') {
    const isEmergency = subtype === 'other_roadside' || subtype === 'breakdown'
    return {
      route: 'review',
      reason: isEmergency
        ? 'Emergency roadside — navigator notified immediately.'
        : 'Roadside/car repair — navigator will coordinate using member\'s coverage.',
      priority: isEmergency ? 'critical' : 'high',
    }
  }

  // ─── 10. Legal / financial — always human ─────────────────────────
  if (serviceType === 'legal_financial') {
    return {
      route: 'review',
      reason: 'Legal or financial request — navigator will provide vetted referral.',
      priority: 'medium',
    }
  }

  // ─── Fallback — unknown type, create task ─────────────────────────
  return {
    route: 'review',
    reason: `Unknown service type "${serviceType}" — navigator will follow up.`,
    priority: 'low',
  }
}

// ─── Helper: build the navigator task description ─────────────────────────
export function buildTaskDescription(
  input: AutoScheduleInput,
  result: AutoScheduleResult,
  bookingId: string,
  memberName: string
): string {
  const typeLabel = input.serviceType.replace(/_/g, ' ')
  const subtypeLabel = input.subtype ? ` (${input.subtype.replace(/_/g, ' ')})` : ''
  return `${memberName} requested ${typeLabel}${subtypeLabel}. Booking: ${bookingId}. ${result.reason}`
}
