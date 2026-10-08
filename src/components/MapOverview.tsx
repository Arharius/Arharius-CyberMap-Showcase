import { MapCanvas } from '../map/MapCanvas'
import type { DisplayEvent } from '../map/buildLayers'
import { kindClass } from '../events/snapshot'
import {
  EVENT_TARGET_CITY,
  RUSSIA_VIEWBOX,
  SHOWCASE_CITY_NODES,
} from '../map/russiaGeometry'

const KIND_LABEL: Record<DisplayEvent['kind'], string> = {
  SCAN: 'Network scan',
  DDOS: 'DDoS activity',
  EXPLOIT_ATTEMPT: 'Exploit attempt',
}

export function MapOverview({
  displayEvents,
  selectedId,
}: {
  displayEvents: readonly DisplayEvent[]
  selectedId: string | null
}) {
  const selected =
    displayEvents.find((event) => event.id === selectedId) ?? displayEvents[0]
  const activeCityId = selected
    ? EVENT_TARGET_CITY[selected.id] ?? 'moscow'
    : null

  return (
    <section className="reference-map-stage" aria-labelledby="map-heading">
      <div className="reference-map-kicker">
        <span>CYBERMAP</span>
        <strong id="map-heading">SYNTHETIC RUSSIA SCENARIO</strong>
      </div>

      <div className="reference-stage-inner">
        <MapCanvas events={displayEvents} selectedId={selected?.id ?? null} />

        <div className="reference-city-overlay" aria-hidden="true">
          {SHOWCASE_CITY_NODES.map((city) => {
            const active = city.id === activeCityId
            return (
              <div
                key={city.id}
                className={`reference-city-label${active ? ' is-active' : ''}`}
                style={{
                  left: `${(city.x / RUSSIA_VIEWBOX.width) * 100}%`,
                  top: `${(city.y / RUSSIA_VIEWBOX.height) * 100}%`,
                }}
              >
                {active && selected ? (
                  <div className={`reference-attack-bubble ${kindClass[selected.kind]}`}>
                    <strong>{city.name}</strong>
                    <span>{KIND_LABEL[selected.kind]}</span>
                  </div>
                ) : (
                  <span className="reference-city-name">{city.name}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="reference-map-legend">
        <span><i className="scan" /> SCAN</span>
        <span><i className="ddos" /> DDOS</span>
        <span><i className="exploit" /> EXPLOIT</span>
        <em>CITY NAMES ONLY · ALL EVENTS SYNTHETIC</em>
      </div>
    </section>
  )
}
