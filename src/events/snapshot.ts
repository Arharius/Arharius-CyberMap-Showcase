import {
  validateCyberEventStream,
  type CyberEvent,
  type EventKind,
} from './schema'
import type { DisplayEvent } from '../map/buildLayers'

type Kind = EventKind
export const kindClass: Record<Kind, string> = {
  SCAN: 'scan',
  DDOS: 'ddos',
  EXPLOIT_ATTEMPT: 'exploit',
}
const events: {
  id: string
  kind: Kind
  timestamp: string
  source: string
  target: string
  severity: string
  confidence: string
}[] = [
  {
    id: 'SYN-006',
    kind: 'EXPLOIT_ATTEMPT',
    timestamp: '00:04:32',
    source: 'Zone C',
    target: 'Zone F',
    severity: 'Elevated',
    confidence: '0.86',
  },
  {
    id: 'SYN-005',
    kind: 'SCAN',
    timestamp: '00:04:18',
    source: 'Zone A',
    target: 'Zone D',
    severity: 'Low',
    confidence: '0.92',
  },
  {
    id: 'SYN-004',
    kind: 'DDOS',
    timestamp: '00:03:56',
    source: 'Zone B',
    target: 'Zone E',
    severity: 'Moderate',
    confidence: '0.78',
  },
  {
    id: 'SYN-003',
    kind: 'SCAN',
    timestamp: '00:03:41',
    source: 'Zone D',
    target: 'Zone F',
    severity: 'Low',
    confidence: '0.89',
  },
  {
    id: 'SYN-002',
    kind: 'DDOS',
    timestamp: '00:03:12',
    source: 'Zone A',
    target: 'Zone E',
    severity: 'Moderate',
    confidence: '0.81',
  },
  {
    id: 'SYN-001',
    kind: 'SCAN',
    timestamp: '00:02:48',
    source: 'Zone C',
    target: 'Zone B',
    severity: 'Low',
    confidence: '0.94',
  },
]
// Fictional display coordinates for the existing static snapshot, not actor locations.
const displayZones: Record<string, [number, number]> = {
  'Zone A': [-120, 45],
  'Zone B': [-80, -25],
  'Zone C': [5, 50],
  'Zone D': [25, -15],
  'Zone E': [105, 40],
  'Zone F': [135, -40],
}

export const snapshot: CyberEvent[] = events.map((event) => ({
  schema_version: '1.0',
  event_id: event.id,
  timestamp: `2026-09-18T${event.timestamp}Z`,
  event_kind: event.kind,
  data_mode: 'SIMULATED',
  provenance_class: 'SIMULATED',
  evidence_level: 'ILLUSTRATIVE',
  scope: 'GLOBAL',
  source: {
    country_code: 'ZZ',
    display_lon: displayZones[event.source][0],
    display_lat: displayZones[event.source][1],
    geo_is_actor: false,
  },
  target: {
    display_name: `Simulation Target ${event.target.slice(-1)}`,
    country_code: 'ZZ',
    display_lon: displayZones[event.target][0],
    display_lat: displayZones[event.target][1],
    target_class: 'demo',
  },
  severity:
    event.severity === 'Low'
      ? 'LOW'
      : event.severity === 'Moderate'
        ? 'MEDIUM'
        : 'HIGH',
  confidence: Number(event.confidence),
  feed_source: 'scenario-generator',
  scenario_id: 'atlas-v1',
  seed: '42',
  metadata: { sourceZone: event.source, targetZone: event.target },
}))

/** Validate before projecting normalized records into the static display. */
export function presentEvents(records: readonly CyberEvent[]) {
  if (!validateCyberEventStream(records))
    throw new Error('Invalid simulated snapshot')
  return [...records]
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .map((record) => ({
      id: record.event_id,
      kind: record.event_kind,
      timestamp: record.timestamp.slice(11, 19),
      source: String(record.metadata.sourceZone ?? 'Fictional source zone'),
      target: String(record.metadata.targetZone ?? record.target.display_name),
      severity: record.severity,
      confidence: record.confidence.toFixed(2),
      display: {
        id: record.event_id,
        kind: record.event_kind,
        source: [record.source.display_lon, record.source.display_lat],
        target: [record.target.display_lon, record.target.display_lat],
      } satisfies DisplayEvent,
    }))
}
export type ShellEvent = ReturnType<typeof presentEvents>[number]
export const countLabel = (count: number) => String(count).padStart(2, '0')
