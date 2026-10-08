import { describe, expect, it } from 'vitest'
import {
  snapshot,
  presentEvents,
  showcaseCities,
} from './snapshot'
import { validateCyberEventStream, type CyberEvent } from './schema'

describe('normalized showcase snapshot', () => {
  it('uses illustrative simulated semantics and city-level fictional nodes', () => {
    expect(validateCyberEventStream(snapshot)).toBe(true)
    expect(snapshot).toHaveLength(6)

    const cityNames = new Set(showcaseCities.map((city) => city.name))
    expect(cityNames).toEqual(
      new Set([
        'Moscow',
        'Saint Petersburg',
        'Saratov',
        'Vladivostok',
        'Murmansk',
      ]),
    )

    for (const event of snapshot) {
      expect(event).toMatchObject({
        data_mode: 'SIMULATED',
        provenance_class: 'SIMULATED',
        evidence_level: 'ILLUSTRATIVE',
        scenario_id: 'atlas-v1',
        seed: '42',
      })
      expect(event.source).toMatchObject({
        country_code: 'ZZ',
        geo_is_actor: false,
      })
      expect(event.target.country_code).toBe('ZZ')
      expect(event.target.display_name).toMatch(/^Simulation Target \\d+$/)
      expect(cityNames.has(String(event.metadata.targetZone))).toBe(true)
      expect(event.metadata.syntheticCityNode).toBe(true)
      expect(String(event.metadata.sourceZone)).toMatch(/^Synthetic Edge \d{2}$/)
    }
  })

  it('projects exactly the normalized geography, kind and confidence without mutating input', () => {
    const input = [...snapshot].reverse()
    const before = structuredClone(input)
    const view = presentEvents(input)
    expect(input).toEqual(before)
    expect(view.map((event) => event.id)).toEqual(
      snapshot.map((event) => event.event_id),
    )
    for (const event of view) {
      const record = snapshot.find((record) => record.event_id === event.id)!
      expect(event.display).toEqual({
        id: record.event_id,
        kind: record.event_kind,
        source: [record.source.display_lon, record.source.display_lat],
        target: [record.target.display_lon, record.target.display_lat],
      })
      expect(event.target).toBe(String(record.metadata.targetZone))
      expect(event.severity).toBe(record.severity)
      expect(event.confidence).toBe(record.confidence.toFixed(2))
    }
    expect(presentEvents([])).toEqual([])
  })

  it('rejects non-simulated and duplicate records at the shell boundary', () => {
    const invalid = {
      ...snapshot[0],
      data_mode: 'LIVE',
    } as unknown as CyberEvent
    expect(() => presentEvents([invalid])).toThrow('Invalid simulated snapshot')
    expect(() => presentEvents([snapshot[0], snapshot[0]])).toThrow(
      'Invalid simulated snapshot',
    )
  })
})
