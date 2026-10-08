import type { Layer } from '@deck.gl/core'
import { ArcLayer, LineLayer, ScatterplotLayer } from '@deck.gl/layers'
import { EVENT_KINDS, type EventKind } from '../events/schema'
import { filterKind, type Filter } from '../state/uiStore'

export interface DisplayEvent {
  id: string
  kind: EventKind
  source: [longitude: number, latitude: number]
  target: [longitude: number, latitude: number]
}
const colors: Record<EventKind, [number, number, number, number]> = {
  SCAN: [121, 212, 233, 210], DDOS: [231, 179, 115, 210], EXPLOIT_ATTEMPT: [219, 170, 238, 230],
}

/** Static category selection boundary; animation and event lifetime are deferred. */
export function buildLayers(events: readonly DisplayEvent[], filter: Filter, selectedId: string | null): Layer[] {
  return EVENT_KINDS.filter(kind => filter === 'ALL' || filterKind[filter] === kind).map(kind => {
    const data = events.filter(event => event.kind === kind)
    const common = { id: `simulated-${kind}`, data, pickable: false }
    if (kind === 'SCAN') return new LineLayer<DisplayEvent>({
      ...common, getSourcePosition: event => event.source, getTargetPosition: event => event.target,
      getColor: colors[kind], getWidth: event => event.id === selectedId ? 3 : 1,
      updateTriggers: { getWidth: selectedId },
    })
    if (kind === 'DDOS') return new ArcLayer<DisplayEvent>({
      ...common, getSourcePosition: event => event.source, getTargetPosition: event => event.target,
      getSourceColor: colors[kind], getTargetColor: colors[kind], getHeight: 0,
      getWidth: event => event.id === selectedId ? 4 : 2, updateTriggers: { getWidth: selectedId },
    })
    return new ScatterplotLayer<DisplayEvent>({
      ...common, getPosition: event => event.target, filled: false, stroked: true,
      getLineColor: colors[kind], radiusUnits: 'pixels', getRadius: event => event.id === selectedId ? 14 : 9,
      lineWidthUnits: 'pixels', getLineWidth: 2, updateTriggers: { getRadius: selectedId },
    })
  })
}
