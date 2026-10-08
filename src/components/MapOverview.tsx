import { MapCanvas } from '../map/MapCanvas'
import type { DisplayEvent } from '../map/buildLayers'
import { filterKind, type Filter } from '../state/uiStore'

export function MapOverview({
  displayEvents,
  filter,
  selectedId,
}: {
  displayEvents: readonly DisplayEvent[]
  filter: Filter
  selectedId: string | null
}) {
  const visibleEvents = displayEvents.filter(
    (event) => filter === 'ALL' || event.kind === filterKind[filter],
  )

  return (
    <section className="panel map-stage showcase-map" aria-labelledby="map-heading">
      <div className="map-heading">
        <div>
          <p className="eyebrow">CYBERMAP SHOWCASE / SYNTHETIC CITY NETWORK</p>
          <h2 id="map-heading">Animated Russia scenario overview</h2>
        </div>
        <span className="small-badge live-badge">AUTO / SYNTHETIC LOOP</span>
      </div>

      <div className="map-frame animated-map-frame">
        <MapCanvas events={visibleEvents} selectedId={selectedId} />
      </div>

      <div className="map-caption">
        <span>CITY-CENTER MARKERS ONLY</span>
        <span>No real organizations · no real infrastructure · fictional scenario</span>
      </div>

      <div className="legend" aria-label="Simulated category legend">
        <span>
          <i className="scan" />
          Synthetic SCAN
        </span>
        <span>
          <i className="ddos" />
          Synthetic DDOS
        </span>
        <span>
          <i className="exploit" />
          Synthetic EXPLOIT_ATTEMPT
        </span>
      </div>
    </section>
  )
}
