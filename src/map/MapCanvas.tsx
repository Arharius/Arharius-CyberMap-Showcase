import type { DisplayEvent } from './buildLayers'
import { kindClass } from '../events/snapshot'

const project = ([lon, lat]: [number, number]) => [
  ((lon + 180) / 360) * 960,
  ((90 - lat) / 180) * 500,
]

export function MapCanvas({ events }: { events: readonly DisplayEvent[] }) {
  return (
    <svg
      className="map-canvas"
      viewBox="0 0 960 500"
      role="img"
      aria-labelledby="map-title map-description"
    >
      <title id="map-title">Simulated global display geography</title>
      <desc id="map-description">
        Offline procedural world silhouette with fictional zones and static
        category arcs. Locations are illustrative only.
      </desc>
      <defs>
        <pattern id="grid" width="60" height="50" patternUnits="userSpaceOnUse">
          <path d="M60 0H0V50" fill="none" stroke="#203445" strokeWidth="0.6" />
        </pattern>
        <pattern id="land" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.3" fill="#426175" />
        </pattern>
      </defs>
      <rect width="960" height="500" fill="url(#grid)" />
      <g fill="url(#land)" stroke="#304a5c" strokeWidth="1.2">
        <path d="M80 115L125 72 220 65 295 90 320 130 283 164 260 208 215 215 197 250 160 208 140 160 95 157Z" />
        <path d="M242 250L291 259 327 306 306 361 277 429 258 393 249 344 219 293Z" />
        <path d="M340 59L388 48 403 81 378 123 350 99Z" />
        <path d="M415 117L449 80 489 96 522 78 606 77 658 59 760 91 839 125 872 161 835 191 776 180 744 219 701 239 677 203 635 190 614 245 584 205 540 173 495 174 475 145 442 164Z" />
        <path d="M449 192L495 177 545 204 560 249 535 298 508 348 476 327 467 287 433 252 425 216Z" />
        <path d="M740 327L794 296 842 323 867 366 821 388 767 378Z" />
        <path d="M667 263L693 276 719 277 748 295 724 305 685 291Z" />
      </g>
      <path d="M0 250H960" className="equator" />
      {events.map((event) => {
        const source = project(event.source)
        const target = project(event.target)
        return (
          <g key={event.id}>
            {event.kind === 'EXPLOIT_ATTEMPT' ? (
              <circle
                cx={target[0]}
                cy={target[1]}
                r="22"
                className="warning-ring"
              />
            ) : (
              <path
                d={`M${source.join(' ')} L${target.join(' ')}`}
                className={`route ${kindClass[event.kind]}`}
              />
            )}
            <circle cx={source[0]} cy={source[1]} r="3" fill="#b6dce8" />
            <circle cx={target[0]} cy={target[1]} r="3" fill="#b6dce8" />
          </g>
        )
      })}
    </svg>
  )
}
