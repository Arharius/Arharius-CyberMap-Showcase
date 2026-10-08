import { validateCyberEventStream, type CyberEvent, type EventKind } from '../events/schema'
import { seededRandom } from './seededRandom'

export const TRANSITION_DURATION_MS = 1000
export const TRANSITION_KINDS = Object.freeze({
  SCAN: 'SCAN_SWEEP',
  DDOS: 'DDOS_PULSE',
  EXPLOIT_ATTEMPT: 'EXPLOIT_TRACE',
} as const satisfies Record<EventKind, string>)

type DeepReadonly<T> = T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T
export type AnimationStatus = 'PAUSED' | 'RUNNING' | 'COMPLETE'
export interface ScheduledEvent {
  readonly event: DeepReadonly<CyberEvent>
  readonly offsetMs: number
}
export interface ActiveTransition {
  readonly scheduledEvent: ScheduledEvent
  readonly kind: typeof TRANSITION_KINDS[EventKind]
  readonly progress: number
}
export interface AnimationState {
  readonly schedulerSeed: string
  readonly clockMs: number
  readonly durationMs: number
  readonly status: AnimationStatus
  readonly scheduledEvents: readonly ScheduledEvent[]
  readonly emittedEventIds: readonly string[]
  readonly activeTransitions: readonly ActiveTransition[]
}

function freezeDeep<T>(value: T): DeepReadonly<T> {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freezeDeep(child)
    Object.freeze(value)
  }
  return value as DeepReadonly<T>
}

/** Validated snapshots isolate the schedule from subsequent caller mutations. */
export function createAnimationState(stream: unknown, schedulerSeed: string): AnimationState {
  if (typeof schedulerSeed !== 'string') throw new TypeError('An explicit scheduler seed is required')
  if (!validateCyberEventStream(stream)) throw new TypeError('Invalid CyberEvent stream')
  if (stream.some(event => event.scenario_id !== stream[0].scenario_id || event.seed !== stream[0].seed)) {
    throw new TypeError('A stream must have one scenario_id and event seed')
  }
  const scored = stream.map(event => ({
    event: freezeDeep(structuredClone(event)),
    time: Date.parse(event.timestamp),
    score: seededRandom(JSON.stringify([schedulerSeed, event.event_id]))(),
  }))
  scored.sort((a, b) => a.time - b.time || a.score - b.score ||
    (a.event.event_id < b.event.event_id ? -1 : a.event.event_id > b.event.event_id ? 1 : 0))
  const earliest = scored[0]?.time ?? 0
  const scheduledEvents = Object.freeze(scored.map(({ event, time }) => Object.freeze({ event, offsetMs: time - earliest })))
  const durationMs = scheduledEvents.length ? scheduledEvents[scheduledEvents.length - 1].offsetMs + TRANSITION_DURATION_MS : 0
  return replay({ schedulerSeed, scheduledEvents, durationMs, clockMs: 0, status: 'PAUSED', emittedEventIds: [], activeTransitions: [] })
}

/** Transitions occupy [offset, offset + duration); IDs persist after expiry. */
function atClock(state: AnimationState, clockMs: number): AnimationState {
  const reached = state.scheduledEvents.filter(item => item.offsetMs <= clockMs)
  const activeTransitions = reached.filter(item => clockMs < item.offsetMs + TRANSITION_DURATION_MS)
    .map(scheduledEvent => Object.freeze({
      scheduledEvent,
      kind: TRANSITION_KINDS[scheduledEvent.event.event_kind],
      progress: (clockMs - scheduledEvent.offsetMs) / TRANSITION_DURATION_MS,
    }))
  return Object.freeze({
    ...state, clockMs, status: clockMs === state.durationMs ? 'COMPLETE' : 'RUNNING',
    emittedEventIds: Object.freeze(reached.map(item => item.event.event_id)),
    activeTransitions: Object.freeze(activeTransitions),
  })
}

/** Resume emits events at the current offset, including offset zero. */
export function resume(state: AnimationState): AnimationState {
  return state.status === 'PAUSED' ? atClock(state, state.clockMs) : state
}

export function pause(state: AnimationState): AnimationState {
  return state.status === 'RUNNING' ? Object.freeze({ ...state, status: 'PAUSED' }) : state
}

/** Reset without rebuilding or reseeding the canonical schedule. */
export function replay(state: AnimationState): AnimationState {
  return Object.freeze({ ...state, clockMs: 0, status: 'PAUSED',
    emittedEventIds: Object.freeze([]), activeTransitions: Object.freeze([]) })
}

export function advance(state: AnimationState, deltaMs: number): AnimationState {
  if (!Number.isFinite(deltaMs) || deltaMs < 0) throw new RangeError('deltaMs must be finite and non-negative')
  if (state.status !== 'RUNNING') return state
  return atClock(state, Math.min(state.durationMs, state.clockMs + deltaMs))
}
