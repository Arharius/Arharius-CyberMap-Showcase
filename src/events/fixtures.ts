import { seededRandom } from '../simulation/seededRandom'
import { EVENT_KINDS, SEVERITIES, isUtcTimestamp, validateCyberEventStream, type CyberEvent, type EventKind } from './schema'

export interface FixtureControls {
  count: number
  eventsPerSecond: number
  eventMix: Record<EventKind, number>
}

export interface FixtureOptions {
  schema_version?: '1.0'
  scenario_id?: string
  seed?: string
  startTime?: string
  controls?: Partial<FixtureControls>
}

/** Chronological stream; consumers can reverse a copy for a newest-first feed. */
export function createSyntheticFixtures(options: FixtureOptions = {}): CyberEvent[] {
  const schema_version = options.schema_version ?? '1.0'
  const scenario_id = options.scenario_id ?? 'global-noise-v1'
  const seed = options.seed ?? '42'
  const startTime = options.startTime ?? '2026-09-18T00:00:00Z'
  const count = options.controls?.count ?? 12
  const rate = options.controls?.eventsPerSecond ?? 1
  const mix = options.controls?.eventMix ?? { SCAN: 1, DDOS: 1, EXPLOIT_ATTEMPT: 1 }
  if (schema_version !== '1.0' || !isUtcTimestamp(startTime) || !Number.isSafeInteger(count) || count < 0 || count > 10000 || !Number.isFinite(rate) || rate <= 0 || rate > 1000) throw new Error('Invalid fixture configuration')
  if (Object.keys(mix).length !== EVENT_KINDS.length || !EVENT_KINDS.every(kind => Object.hasOwn(mix, kind) && Number.isFinite(mix[kind]) && mix[kind] >= 0)) throw new Error('Invalid fixture event mix')
  const total = EVENT_KINDS.reduce((sum, kind) => sum + mix[kind], 0)
  if (!Number.isFinite(total) || total <= 0) throw new Error('Invalid fixture event mix')
  // Canonical kind order makes object insertion order irrelevant to reproduction.
  const random = seededRandom(JSON.stringify([schema_version, scenario_id, seed, startTime, count, rate, EVENT_KINDS.map(kind => mix[kind])]))
  const baseTime = Date.parse(startTime)
  const makeEvent = (index: number): CyberEvent => {
    // Stratified selection guarantees all three kinds in the default fixture.
    const position = ((index + random()) / Math.max(count, 1)) * total
    let boundary = 0
    const kind = EVENT_KINDS.find(kind => { boundary += mix[kind]; return position < boundary })!
    const timestamp = baseTime + Math.round(index * 1000 / rate)
    if (!Number.isFinite(timestamp) || timestamp > 253402300799999) throw new Error('Fixture timestamp out of range')
    return {
      schema_version, event_id: `sim-${String(index + 1).padStart(6, '0')}`,
      timestamp: new Date(timestamp).toISOString(), event_kind: kind,
      data_mode: 'SIMULATED', provenance_class: 'SIMULATED', evidence_level: 'ILLUSTRATIVE', scope: 'GLOBAL',
      source: { country_code: 'ZZ', display_lat: Math.round(random() * 160 - 80), display_lon: Math.round(random() * 360 - 180), geo_is_actor: false },
      target: { display_name: `Simulation Target ${index % 6 + 1}`, country_code: 'ZZ', display_lat: Math.round(random() * 160 - 80), display_lon: Math.round(random() * 360 - 180), target_class: 'demo' },
      severity: SEVERITIES[Math.floor(random() * SEVERITIES.length)], confidence: Math.round(random() * 1000) / 1000,
      feed_source: 'scenario-generator', scenario_id, seed, metadata: {},
    }
  }
  // Validate even empty streams' scenario/seed inputs with an unreturned probe.
  if (count === 0 && !validateCyberEventStream([makeEvent(0)])) throw new Error('Invalid synthetic event inputs')
  const events = Array.from({ length: count }, (_, index) => makeEvent(index))
  if (!validateCyberEventStream(events)) throw new Error('Invalid synthetic fixture stream')
  return events
}
