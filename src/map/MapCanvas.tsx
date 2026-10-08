import type { DisplayEvent } from './buildLayers'
import { kindClass, showcaseCities } from '../events/snapshot'

const LON_MIN = 15
const LON_MAX = 150
const LAT_MIN = 38
const LAT_MAX = 75

const project = ([lon, lat]: [number, number]): [number, number] => [
  70 + ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * 860,
  485 - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * 375,
]

const outlineCoordinates: [number, number][] = [
  [19, 53],
  [27, 58],
  [34, 66],
  [52, 70],
  [76, 72],
  [104, 72],
  [129, 70],
  [148, 65],
  [146, 58],
  [136, 50],
  [125, 44],
  [105, 47],
  [88, 50],
  [70, 51],
  [56, 49],
  [44, 45],
  [34, 48],
  [25, 51],
]

const labelOffset: Record<string, [number, number]> = {
  Moscow: [14, -14],
  'Saint Petersburg': [14, -18],
  Saratov: [14, 22],
  Vladivostok: [-102, 22],
  Murmansk: [14, -18],
}

function curvedPath(event: DisplayEvent, index: number) {
  const [sx, sy] = project(event.source)
  const [tx, ty] = project(event.target)
  const mx = (sx + tx) / 2
  const my = (sy + ty) / 2 - Math.max(28, Math.abs(tx - sx) * 0.12) - (index % 2) * 18
  return `M${sx.toFixed(1)} ${sy.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`
}

export function MapCanvas({
  events,
  selectedId,
}: {
  events: readonly DisplayEvent[]
  selectedId: string | null
}) {
  const outlinePoints = outlineCoordinates
    .map((coordinates) => project(coordinates).join(','))
    .join(' ')

  return (
    <svg
      className="map-canvas showcase-canvas"
      viewBox="0 0 1000 560"
      role="img"
      aria-labelledby="map-title map-description"
    >
      <title id="map-title">Animated synthetic city-node scenario</title>
      <desc id="map-description">
        Stylized Russia geography with five city-center markers used only as
        fictional portfolio nodes. Animated routes are synthetic and do not
        represent real attacks, organizations, infrastructure, or incidents.
      </desc>

      <defs>
        <linearGradient id="map-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#06111f" />
          <stop offset="0.52" stopColor="#0b1d2d" />
          <stop offset="1" stopColor="#050b13" />
        </linearGradient>
        <radialGradient id="land-glow" cx="50%" cy="45%" r="65%">
          <stop offset="0" stopColor="#174155" stopOpacity="0.92" />
          <stop offset="0.72" stopColor="#0c2738" stopOpacity="0.72" />
          <stop offset="1" stopColor="#071522" stopOpacity="0.2" />
        </radialGradient>
        <pattern id="showcase-grid" width="42" height="42" patternUnits="userSpaceOnUse">
          <path d="M42 0H0V42" fill="none" stroke="#3e7184" strokeWidth="0.55" opacity="0.24" />
        </pattern>
        <filter id="city-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="route-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="1000" height="560" rx="18" fill="url(#map-bg)" />
      <rect x="18" y="18" width="964" height="524" rx="14" fill="url(#showcase-grid)" />

      <g className="russia-study">
        <polygon
          points={outlinePoints}
          className="russia-outline"
          fill="url(#land-glow)"
        />
        <polyline
          points={outlinePoints}
          className="russia-edge-glow"
          fill="none"
        />
      </g>

      <g className="scan-sweep-layer" aria-hidden="true">
        <rect x="-260" y="60" width="220" height="430" className="scan-sweep" />
      </g>

      <g aria-hidden="true">
        {events.map((event, index) => {
          const source = project(event.source)
          const target = project(event.target)
          const path = curvedPath(event, index)
          const selected = event.id === selectedId
          const className = kindClass[event.kind]
          const pathId = `showcase-route-${event.id}`

          return (
            <g key={event.id} className={selected ? 'route-group selected-route' : 'route-group'}>
              <path
                id={pathId}
                d={path}
                className={`showcase-route ${className}${selected ? ' selected' : ''}`}
                filter="url(#route-glow)"
              />
              <circle
                cx={source[0]}
                cy={source[1]}
                r={selected ? 5 : 3.2}
                className={`source-node ${className}`}
              />
              <circle
                cx={target[0]}
                cy={target[1]}
                r={selected ? 6.5 : 4}
                className={`target-flash ${className}`}
              />
              <circle r={selected ? 5 : 3.5} className={`route-particle ${className}`}>
                <animateMotion
                  dur={`${3.2 + (index % 3) * 0.55}s`}
                  begin={`${index * -0.7}s`}
                  repeatCount="indefinite"
                  rotate="auto"
                >
                  <mpath href={`#${pathId}`} />
                </animateMotion>
              </circle>
            </g>
          )
        })}
      </g>

      <g className="city-node-layer">
        {showcaseCities.map((city, index) => {
          const [x, y] = project(city.coordinates)
          const [dx, dy] = labelOffset[city.name] ?? [12, -12]

          return (
            <g key={city.name} className="city-node" transform={`translate(${x} ${y})`}>
              <circle
                r="20"
                className="city-pulse city-pulse-outer"
                style={{ animationDelay: `${index * -0.55}s` }}
              />
              <circle
                r="10"
                className="city-pulse city-pulse-inner"
                style={{ animationDelay: `${index * -0.32}s` }}
              />
              <circle r="4.8" className="city-core" filter="url(#city-glow)" />
              <line x1="0" y1="0" x2={dx > 0 ? 10 : -10} y2={dy > 0 ? 10 : -10} className="city-leader" />
              <text x={dx} y={dy} className="city-label">
                {city.name}
              </text>
              <text x={dx} y={dy + 13} className="city-sub-label">
                SYNTHETIC NODE
              </text>
            </g>
          )
        })}
      </g>

      <g className="map-hud" aria-hidden="true">
        <text x="42" y="48">CYBERMAP / PORTFOLIO MODE</text>
        <text x="958" y="48" textAnchor="end">AUTO LOOP · SYNTHETIC</text>
        <text x="42" y="526">NO REAL TARGETS · NO REAL INFRASTRUCTURE</text>
        <text x="958" y="526" textAnchor="end">CITY-CENTER DISPLAY MARKERS</text>
      </g>
    </svg>
  )
}
