import { MapStage } from '../map/MapStage'
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
  return (
    <section className="panel map-stage" aria-labelledby="map-heading">
      <div className="map-heading">
        <div>
          <p className="eyebrow">SYNTHETIC ATLAS / 01</p>
          <h2 id="map-heading">Global simulation overview</h2>
        </div>
        <span className="small-badge">OFFLINE / STATIC</span>
      </div>
      <div className="map-frame">
        <MapStage
          events={displayEvents}
          filter={filter}
          selectedId={selectedId}
        >
          <MapCanvas
            events={displayEvents.filter(
              (event) => filter === 'ALL' || event.kind === filterKind[filter],
            )}
          />
        </MapStage>
      </div>
      <div className="map-caption">
        <span>PROCEDURAL WORLD STUDY</span>
        <span>Display geography only · fictional zones</span>
      </div>
      <div className="legend" aria-label="Simulated category legend">
        <span>
          <i className="scan" />
          Simulated SCAN
        </span>
        <span>
          <i className="ddos" />
          Simulated DDOS
        </span>
        <span>
          <i className="exploit" />
          Simulated EXPLOIT_ATTEMPT
        </span>
      </div>
    </section>
  )
}
