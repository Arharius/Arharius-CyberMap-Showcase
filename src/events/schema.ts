export const EVENT_KINDS = ['SCAN', 'DDOS', 'EXPLOIT_ATTEMPT'] as const
export const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
export type EventKind = typeof EVENT_KINDS[number]
export type Severity = typeof SEVERITIES[number]
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

export interface CyberEvent {
  schema_version: '1.0'
  event_id: string
  timestamp: string
  event_kind: EventKind
  data_mode: 'SIMULATED'
  provenance_class: 'SIMULATED'
  evidence_level: 'ILLUSTRATIVE'
  scope: 'GLOBAL'
  /** Coordinates describe display geography only, never actor location. */
  source: { country_code: string; display_lat: number; display_lon: number; geo_is_actor: false }
  target: { display_name: string; country_code: string; display_lat: number; display_lon: number; target_class: string }
  /** Visual priority, not observed impact. */
  severity: Severity
  /** Simulation coherence, not observation confidence. */
  confidence: number
  feed_source: 'scenario-generator'
  scenario_id: string
  seed: string
  metadata: { [key: string]: JsonValue }
  dedup_key?: string
}

const fields = ['schema_version', 'event_id', 'timestamp', 'event_kind', 'data_mode', 'provenance_class', 'evidence_level', 'scope', 'source', 'target', 'severity', 'confidence', 'feed_source', 'scenario_id', 'seed', 'metadata']
const unsafe = /actor|attribution|breach|compromis|organization|organisation|provider|payload|raw.?event|vulnerab|\bcve\b|\bcwe\b|\biocs?\b|indicator|malware|ransomware|victim|telemetry|\bpublic\b|\breal\b|\blive\b|\bip(?:v[46])?\b|ip.?address|hostname|domain|url|hash|threat.?group|\bapt\s*\d+\b|exfiltrat|intrusion|attack.?success/i
const address = /(?:\d{1,3}\.){3}\d{1,3}|(?:[a-f\d]{0,4}:){2,}[a-f\d:]*|https?:\/\/|\b[a-f\d]{32,128}\b|\b[a-z\d-]+(?:\.[a-z\d-]+)*\.[a-z]{2,63}\b/i
const safeText = (value: string) => !unsafe.test(value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ')) && !address.test(value)
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
const shape = (value: Record<string, unknown>, required: string[], optional: string[] = []) => required.every(key => Object.hasOwn(value, key)) && Reflect.ownKeys(value).every(key => typeof key === 'string' && [...required, ...optional].includes(key))
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && safeText(value)
const range = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max

function safeJson(value: unknown, ancestors = new Set<object>(), depth = 0): boolean {
  if (depth > 32) return false
  if (value === null || typeof value === 'boolean') return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'string') return safeText(value)
  if (!Array.isArray(value) && !object(value)) return false
  if (ancestors.has(value)) return false
  ancestors.add(value)
  const valid = Reflect.ownKeys(value).every(key => {
    if (Array.isArray(value) && key === 'length') return true
    if (typeof key !== 'string' || !safeText(key) || ['__proto__', 'constructor', 'prototype', ...fields, 'geo_is_actor', 'display_name', 'target_class'].includes(key)) return false
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    return !!descriptor && descriptor.enumerable === true && 'value' in descriptor && safeJson(descriptor.value, ancestors, depth + 1)
  })
  ancestors.delete(value)
  return valid
}

export function isUtcTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|\+00:00)$/.test(value)) return false
  const time = Date.parse(value)
  return Number.isFinite(time) && new Date(time).toISOString() === value.replace(/(?:\.(\d+))?(?:Z|\+00:00)$/, (_, fraction: string | undefined) => `.${(fraction ?? '').padEnd(3, '0').slice(0, 3)}Z`)
}

/** Fail closed on unknown record fields; metadata must be safe, plain JSON. */
export function validateCyberEvent(value: unknown): value is CyberEvent {
  try {
    if (!object(value) || !shape(value, fields, ['dedup_key'])) return false
    // Avoid evaluating accessor properties supplied by non-JSON callers.
    if (!Object.values(Object.getOwnPropertyDescriptors(value)).every(d => 'value' in d && d.enumerable)) return false
    if (value.schema_version !== '1.0' || value.data_mode !== 'SIMULATED' || value.provenance_class !== 'SIMULATED' || value.evidence_level !== 'ILLUSTRATIVE' || value.scope !== 'GLOBAL' || value.feed_source !== 'scenario-generator') return false
    if (!EVENT_KINDS.includes(value.event_kind as EventKind) || !SEVERITIES.includes(value.severity as Severity)) return false
    if (!text(value.event_id) || !text(value.scenario_id) || !/-v\d+(?:\.\d+)*$/.test(value.scenario_id) || typeof value.seed !== 'string' || !safeText(value.seed)) return false
    if (!isUtcTimestamp(value.timestamp) || !range(value.confidence, 0, 1)) return false
    if (Object.hasOwn(value, 'dedup_key') && (typeof value.dedup_key !== 'string' || !safeText(value.dedup_key))) return false
    const { source, target } = value
    if (!object(source) || !object(target)) return false
    if (!shape(source, ['country_code', 'display_lat', 'display_lon', 'geo_is_actor']) || !shape(target, ['display_name', 'country_code', 'display_lat', 'display_lon', 'target_class'])) return false
    for (const geography of [source, target]) {
      if (!Object.values(Object.getOwnPropertyDescriptors(geography)).every(d => 'value' in d && d.enumerable)) return false
      if (typeof geography.country_code !== 'string' || !/^[A-Z]{2}$/.test(geography.country_code) || !range(geography.display_lat, -90, 90) || !range(geography.display_lon, -180, 180)) return false
    }
    // Deliberately generic identifiers, not arbitrary organization names.
    if (source.geo_is_actor !== false || typeof target.display_name !== 'string' || !/^Simulation Target (?:[A-Z]|\d+)$/.test(target.display_name)) return false
    if (!text(target.target_class)) return false
    return object(value.metadata) && safeJson(value.metadata)
  } catch {
    return false
  }
}

/** Scenario-level uniqueness cannot be established by validating one record. */
export function validateCyberEventStream(value: unknown): value is CyberEvent[] {
  if (!Array.isArray(value)) return false
  const ids = new Set<string>()
  return Array.from(value).every(event => {
    if (!validateCyberEvent(event)) return false
    const key = JSON.stringify([event.scenario_id, event.event_id])
    if (ids.has(key)) return false
    ids.add(key)
    return true
  })
}
