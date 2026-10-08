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
  sourceCoords: [number, number]
  target: string
  targetCoords: [number, number]
  severity: string
  confidence: string
}[] = [
  {
    id: 'SYN-006',
    kind: 'EXPLOIT_ATTEMPT',
    timestamp: '00:04:32',
    source: 'Synthetic Edge 01',
    sourceCoords: [18, 53],
    target: 'Moscow',
    targetCoords: [37.62, 55.76],
    severity: 'Elevated',
    confidence: '0.86',
  },
  {
    id: 'SYN-005',
    kind: 'SCAN',
    timestamp: '00:04:18',
    source: 'Synthetic Edge 02',
    sourceCoords: [18, 69],
    target: 'Murmansk',
    targetCoords: [33.08, 68.96],
    severity: 'Low',
    confidence: '0.92',
  },
  {
    id: 'SYN-004',
    kind: 'DDOS',
    timestamp: '00:03:56',
    source: 'Synthetic Edge 03',
    sourceCoords: [149, 48],
    target: 'Vladivostok',
    targetCoords: [131.89, 43.12],
    severity: 'Moderate',
    confidence: '0.78',
  },
  {
    id: 'SYN-003',
    kind: 'SCAN',
    timestamp: '00:03:41',
    source: 'Synthetic Edge 04',
    sourceCoords: [20, 58],
    target: 'Saint Petersburg',
    targetCoords: [30.34, 59.93],
    severity: 'Low',
    confidence: '0.89',
  },
  {
    id: 'SYN-002',
    kind: 'DDOS',
    timestamp: '00:03:12',
    source: 'Synthetic Edge 05',
    sourceCoords: [55, 40],
    target: 'Saratov',
    targetCoords: [46.03, 51.53],
    severity: 'Moderate',
    confidence: '0.81',
  },
  {
    id: 'SYN-001',
    kind: 'SCAN',
    timestamp: '00:02:48',
    source: 'Synthetic Edge 06',
    sourceCoords: [92, 40],
    target: 'Moscow',
    targetCoords: [37.62, 55.76],
    severity: 'Low',
    confidence: '0.94',
  },
]

export const showcaseCities = [
  { name: 'Moscow', coordinates: [37.62, 55.76] as [number, number] },
  {
    name: 'Saint Petersburg',
    coordinates: [30.34, 59.93] as [number, number],
  },
  { name: 'Saratov', coordinates: [46.03, 51.53] as [number, number] },
  { name: 'Vladivostok', coordinates: [131.89, 43.12] as [number, number] },
  { name: 'Murmansk', coordinates: [33.08, 68.96] as [number, number] },
] as const

export const snapshot: CyberEvent[] = events.map((event, index) => ({
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
    display_lon: event.sourceCoords[0],
    display_lat: event.sourceCoords[1],
    geo_is_actor: false,
  },
  target: {
    display_name: `Simulation Target ${index + 1}`,
    country_code: 'ZZ',
    display_lon: event.targetCoords[0],
    display_lat: event.targetCoords[1],
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
  metadata: {
    sourceZone: event.source,
    targetZone: event.target,
    syntheticCityNode: true,
  },
}))

/** Validate before projecting normalized records into the display. */
export function presentEvents(records: readonly CyberEvent[]) {
  if (!validateCyberEventStream(records))
    throw new Error('Invalid simulated snapshot')
  return [...records]
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .map((record) => ({
      id: record.event_id,
      kind: record.event_kind,
      timestamp: record.timestamp.slice(11, 19),
      source: String(record.metadata.sourceZone ?? 'Synthetic source node'),
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
