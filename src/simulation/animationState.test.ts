import { describe, expect, it, vi } from 'vitest'
import { type CyberEvent, type EventKind } from '../events/schema'
import { seededRandom } from './seededRandom'
import { advance, createAnimationState, pause, replay, resume, TRANSITION_DURATION_MS, type AnimationState } from './animationState'

function event(event_id: string, offsetMs = 0, event_kind: EventKind = 'SCAN'): CyberEvent {
  return {
    schema_version: '1.0', event_id, timestamp: new Date(Date.parse('2026-09-18T00:00:00Z') + offsetMs).toISOString(), event_kind,
    data_mode: 'SIMULATED', provenance_class: 'SIMULATED', evidence_level: 'ILLUSTRATIVE', scope: 'GLOBAL',
    source: { country_code: 'ZZ', display_lat: 10, display_lon: 20, geo_is_actor: false },
    target: { display_name: 'Simulation Target A', country_code: 'ZZ', display_lat: 30, display_lon: 40, target_class: 'demo' },
    severity: 'LOW', confidence: 0.8, feed_source: 'scenario-generator', scenario_id: 'global-noise-v1', seed: '42',
    metadata: { visual: { labels: ['demo'], step: 1 } },
  }
}
const stream = () => [event('c', 500, 'EXPLOIT_ATTEMPT'), event('b', 0, 'DDOS'), event('a'), event('d', 1500)]
const ids = (state: AnimationState) => state.scheduledEvents.map(item => item.event.event_id)
function sequence(input: CyberEvent[], seed = 'scheduler') {
  const initial = createAnimationState(input, seed)
  const running = resume(initial)
  const advanced = advance(running, 600)
  const paused = pause(advanced)
  const continued = advance(resume(paused), 900)
  const complete = advance(continued, 10000)
  return [initial, running, advanced, paused, advance(paused, 900), continued, complete, replay(complete)]
}
function freezeDeep(value: object) {
  Object.values(value).forEach(child => { if (child !== null && typeof child === 'object') freezeDeep(child) })
  Object.freeze(value)
}

describe('deterministic animation state', () => {
  it('reproduces byte/deep-equal schedules and state sequences across runs and permutations', () => {
    const input = stream()
    const expected = sequence(input)
    for (const permutation of [input, [...input].reverse(), [input[2], input[0], input[3], input[1]]]) {
      expect(sequence(permutation)).toEqual(expected)
      expect(JSON.stringify(sequence(permutation))).toBe(JSON.stringify(expected))
    }
    expect(expected[0].clockMs).toBe(0)
    expect(expected[0].status).toBe('PAUSED')
    expect(expected[0].emittedEventIds).toEqual([])
    expect(expected[0].activeTransitions).toEqual([])
  })

  it('uses one independent seeded score per ID and permits seed changes only within timestamp ties', () => {
    const input = [event('early', -500), ...Array.from({ length: 12 }, (_, i) => event(`tie-${i}`)), event('late', 500)]
    const schedules = ['one', 'two', 'three'].map(seed => createAnimationState(input, seed))
    for (const state of schedules) {
      const expectedTies = input.slice(1, -1).map(item => ({ id: item.event_id,
        score: seededRandom(JSON.stringify([state.schedulerSeed, item.event_id]))(),
      })).sort((a, b) => a.score - b.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).map(item => item.id)
      expect(ids(state)).toEqual(['early', ...expectedTies, 'late'])
      expect(state.scheduledEvents.map(item => item.offsetMs)).toEqual([0, ...Array(12).fill(500), 1000])
      for (const item of state.scheduledEvents) expect(item.event).toEqual(input.find(original => original.event_id === item.event.event_id))
    }
    expect(new Set(schedules.map(state => JSON.stringify(ids(state)))).size).toBeGreaterThan(1)
  })

  it('freezes a paused clock and resumes without losing or duplicating emissions', () => {
    const initial = createAnimationState(stream(), 's')
    expect(advance(initial, 5000)).toBe(initial)
    expect(pause(initial)).toBe(initial)
    const running = advance(resume(initial), 250)
    expect(resume(running)).toBe(running)
    const paused = pause(running)
    expect(advance(paused, 9000)).toBe(paused)
    expect(paused.clockMs).toBe(250)
    expect(resume(paused)).toEqual(running)
    expect(advance(resume(paused), 250).emittedEventIds).toHaveLength(3)
  })

  it('crosses multiple boundaries, emits each ID once, and expires transitions at exact endpoints', () => {
    const initial = createAnimationState(stream(), 's')
    const started = resume(initial)
    expect(started.emittedEventIds).toEqual(ids(initial).slice(0, 2))
    expect(advance(started, 499).emittedEventIds).toHaveLength(2)
    expect(advance(started, 500).emittedEventIds).toHaveLength(3)
    const jumped = advance(started, 1500)
    expect(jumped.emittedEventIds).toEqual(ids(initial))
    expect(jumped.activeTransitions.map(item => item.scheduledEvent.event.event_id)).toEqual(['d'])
    expect(jumped.activeTransitions[0].progress).toBe(0)
    expect(advance(jumped, 0)).toEqual(jumped)
    expect(advance(jumped, 400).emittedEventIds).toEqual(ids(initial))
    expect(new Set(jumped.emittedEventIds).size).toBe(4)
    expect(advance(advance(started, 500), 1000)).toEqual(jumped)
  })

  it('clamps completion and replays the exact initial paused state with the same schedule', () => {
    const initial = createAnimationState(stream(), 's')
    expect(TRANSITION_DURATION_MS).toBe(1000)
    expect(initial.durationMs).toBe(2500)
    const complete = advance(resume(initial), Number.MAX_VALUE)
    expect(complete.clockMs).toBe(2500)
    expect(complete.status).toBe('COMPLETE')
    expect(complete.activeTransitions).toEqual([])
    expect(complete.emittedEventIds).toEqual(ids(initial))
    expect(advance(complete, 100)).toBe(complete)
    expect(resume(complete)).toBe(complete)
    expect(pause(complete)).toBe(complete)
    expect(advance(resume(initial), 2500)).toEqual(complete)
    for (const state of [initial, advance(resume(initial), 200), pause(resume(initial)), complete]) {
      expect(replay(state)).toEqual(initial)
      expect(replay(state).scheduledEvents).toBe(initial.scheduledEvents)
    }
    expect(advance(resume(replay(complete)), 2500)).toEqual(complete)
  })

  it('allows an empty valid stream only with an explicit scheduler seed', () => {
    const initial = createAnimationState([], '')
    expect(initial.durationMs).toBe(0)
    expect(initial.status).toBe('PAUSED')
    expect(initial.scheduledEvents).toEqual([])
    expect(resume(initial)).toEqual({ ...initial, status: 'COMPLETE' })
    expect(replay(resume(initial))).toEqual(initial)
    expect(() => createAnimationState([], undefined as unknown as string)).toThrow()
  })

  it.each([-1, NaN, Infinity, -Infinity, '1', null, undefined])('rejects invalid delta %s in every status', delta => {
    const initial = createAnimationState(stream(), 's')
    for (const state of [initial, resume(initial), advance(resume(initial), 2500)]) {
      expect(() => advance(state, delta as number)).toThrow(RangeError)
    }
  })

  it('rejects malformed, duplicate, mixed-scenario and mixed-event-seed streams', () => {
    const a = event('a')
    for (const input of [null, {}, [null], Array(1), [a, a], [{ ...a, timestamp: 'invalid' }],
      [{ ...a, event_kind: 'UNKNOWN' }], [a, { ...event('b'), scenario_id: 'global-noise-v2' }],
      [a, { ...event('b'), seed: '43' }]]) {
      expect(() => createAnimationState(input, 's')).toThrow()
    }
  })

  it.each([
    ['SCAN', 'SCAN_SWEEP'], ['DDOS', 'DDOS_PULSE'], ['EXPLOIT_ATTEMPT', 'EXPLOIT_TRACE'],
  ] as const)('derives the %s transition from its scheduled offset', (kind, hook) => {
    const initial = createAnimationState([event('a', 0), event('b', 2000, kind)], 's')
    const before = advance(resume(initial), 1999)
    expect(before.activeTransitions).toEqual([])
    const middle = advance(before, 501)
    expect(middle.activeTransitions).toEqual([{ scheduledEvent: initial.scheduledEvents[1], kind: hook, progress: 0.5 }])
    expect(advance(middle, 500).activeTransitions).toEqual([])
  })

  it('never mutates or freezes caller data and exposes deeply immutable snapshots', () => {
    const input = stream()
    const original = structuredClone(input)
    sequence(input)
    expect(input).toEqual(original)
    expect(Object.isFrozen(input)).toBe(false)
    expect(Object.isFrozen(input[0].source)).toBe(false)
    freezeDeep(input)
    const states = sequence(input)
    expect(input).toEqual(original)
    for (const state of states) {
      expect(Object.isFrozen(state)).toBe(true)
      expect(Object.isFrozen(state.scheduledEvents)).toBe(true)
      expect(Object.isFrozen(state.emittedEventIds)).toBe(true)
      expect(Object.isFrozen(state.activeTransitions)).toBe(true)
      expect(Object.isFrozen(state.scheduledEvents[0].event.source)).toBe(true)
      expect(() => { (state.emittedEventIds as string[]).push('extra') }).toThrow()
    }
    const mutable = stream()
    const state = createAnimationState(mutable, 's')
    const bytes = JSON.stringify(state)
    mutable[0].source.display_lat = 0
    mutable[0].metadata.visual = null
    mutable.reverse()
    expect(JSON.stringify(state)).toBe(bytes)
  })

  it('does not consult ambient randomness or wall time during create, advance and replay', () => {
    const input = stream()
    const forbidden = () => { throw new Error('Ambient randomness or clock used') }
    const random = vi.spyOn(Math, 'random').mockImplementation(forbidden)
    const now = vi.spyOn(Date, 'now').mockImplementation(forbidden)
    try {
      expect(sequence(input)).toEqual(sequence([...input].reverse()))
      expect(advance(resume(createAnimationState([], 's')), 0).status).toBe('COMPLETE')
      expect(random).not.toHaveBeenCalled()
      expect(now).not.toHaveBeenCalled()
    } finally {
      random.mockRestore()
      now.mockRestore()
    }
  })
})
