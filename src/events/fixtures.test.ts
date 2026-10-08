import { describe, expect, it } from 'vitest'
import { createSyntheticFixtures } from './fixtures'
import { EVENT_KINDS, validateCyberEventStream } from './schema'

describe('synthetic fixture stream', () => {
  it('contains each frozen kind, generic targets and valid normalized fields', () => {
    const events = createSyntheticFixtures()
    expect(validateCyberEventStream(events)).toBe(true)
    expect(new Set(events.map(event => event.event_kind))).toEqual(new Set(EVENT_KINDS))
    expect(events.every(event => event.source.geo_is_actor === false && /^Simulation Target \d+$/.test(event.target.display_name))).toBe(true)
    expect(events.every(event => Object.keys(event.metadata).length === 0)).toBe(true)
  })
  it('reproduces the ordered stream, regardless of event-mix key insertion order', () => {
    const options = { seed: 'test', controls: { count: 20, eventsPerSecond: 2, eventMix: { SCAN: 2, DDOS: 3, EXPLOIT_ATTEMPT: 1 } } }
    const events = createSyntheticFixtures(options)
    expect(createSyntheticFixtures(options)).toEqual(events)
    expect(createSyntheticFixtures({ ...options, controls: { ...options.controls, eventMix: { EXPLOIT_ATTEMPT: 1, DDOS: 3, SCAN: 2 } } })).toEqual(events)
    expect(new Set(events.map(event => event.event_id)).size).toBe(events.length)
    expect(events.map(event => event.timestamp)).toEqual(events.map(event => event.timestamp).sort())
    expect(Date.parse(events[1].timestamp) - Date.parse(events[0].timestamp)).toBe(500)
    for (const changes of [{ seed: 'different' }, { scenario_id: 'global-noise-v2' }, { controls: { count: 20, eventsPerSecond: 3 } }]) {
      expect(createSyntheticFixtures({ ...options, ...changes })).not.toEqual(events)
    }
  })
  it('supports empty and single-kind streams without shared mutable output', () => {
    expect(createSyntheticFixtures({ controls: { count: 0 } })).toEqual([])
    const events = createSyntheticFixtures({ controls: { eventMix: { SCAN: 0, DDOS: 1, EXPLOIT_ATTEMPT: 0 } } })
    expect(events.every(event => event.event_kind === 'DDOS')).toBe(true)
    const previous = createSyntheticFixtures()
    previous[0].target.display_name = 'mutated'
    expect(createSyntheticFixtures()[0].target.display_name).toBe('Simulation Target 1')
  })
  it.each([
    { controls: { count: -1 } }, { controls: { count: 1.5 } }, { controls: { count: 10001 } },
    { controls: { eventsPerSecond: 0 } }, { controls: { eventsPerSecond: NaN } },
    { controls: { eventMix: { SCAN: 0, DDOS: 0, EXPLOIT_ATTEMPT: 0 } } },
    { controls: { eventMix: { SCAN: -1, DDOS: 2, EXPLOIT_ATTEMPT: 1 } } },
    { startTime: '2026-02-30T00:00:00Z' }, { scenario_id: 'unversioned' },
    { seed: '192.0.2.1', controls: { count: 0 } },
  ])('rejects invalid generation input %j', options => {
    expect(() => createSyntheticFixtures(options)).toThrow()
  })
})
