import type { DisplayEvent } from './buildLayers'
import { kindClass } from '../events/snapshot'
import {
  EVENT_TARGET_CITY,
  RUSSIA_OUTLINE_PATH,
  SHOWCASE_CITY_NODES,
  SYNTHETIC_ORIGINS,
} from './russiaGeometry'

const CITY_BY_ID = Object.fromEntries(
  SHOWCASE_CITY_NODES.map((city) => [city.id, city]),
) as Record<string, (typeof SHOWCASE_CITY_NODES)[number]>

function routeFor(event: DisplayEvent, index: number) {
  const target = CITY_BY_ID[EVENT_TARGET_CITY[event.id] ?? 'moscow']
  const origin = SYNTHETIC_ORIGINS[index % SYNTHETIC_ORIGINS.length]
  const mx = (origin.x + target.x) / 2
  const my = (origin.y + target.y) / 2 - Math.max(90, Math.abs(target.x - origin.x) * 0.18)
  return {
    target,
    origin,
    path: `M${origin.x} ${origin.y} Q${mx.toFixed(1)} ${Math.max(45, my).toFixed(1)} ${target.x} ${target.y}`,
  }
}

export function MapCanvas({
  events,
  selectedId,
}: {
  events: readonly DisplayEvent[]
  selectedId: string | null
}) {
  return (
    <svg
      className="reference-map-svg"
      viewBox="0 0 2280 1296.1"
      role="img"
      aria-labelledby="map-title map-description"
      preserveAspectRatio="xMidYMid meet"
    >
      <title id="map-title">Synthetic cyber-event map of Russia</title>
      <desc id="map-description">
        Portfolio visualization with five public city names. All events,
        routes, sources and incidents are fictional and synthetic.
      </desc>

      <defs>
        <filter id="edge-blur" x="-8%" y="-8%" width="116%" height="116%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id="node-glow" x="-200%" y="-200%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id="land-dots" width="13" height="13" patternUnits="userSpaceOnUse">
          <circle cx="6.5" cy="6.5" r="1.1" fill="rgba(90,175,255,.19)" />
        </pattern>
        <linearGradient id="land-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0d1d3d" />
          <stop offset="1" stopColor="#071024" />
        </linearGradient>
        <radialGradient id="stage-vignette" cx="50%" cy="45%" r="63%">
          <stop offset="0" stopColor="#0f2148" stopOpacity=".32" />
          <stop offset=".58" stopColor="#071329" stopOpacity=".15" />
          <stop offset="1" stopColor="#02050d" stopOpacity=".78" />
        </radialGradient>
        <clipPath id="russia-clip">
          <path d={RUSSIA_OUTLINE_PATH} />
        </clipPath>
      </defs>

      <rect width="2280" height="1296.1" fill="transparent" />
      <rect width="2280" height="1296.1" fill="url(#stage-vignette)" />

      <path
        d={RUSSIA_OUTLINE_PATH}
        className="reference-edge-glow"
        filter="url(#edge-blur)"
      />
      <path d={RUSSIA_OUTLINE_PATH} className="reference-land" />
      <g clipPath="url(#russia-clip)">
        <rect width="2280" height="1296.1" fill="url(#land-dots)" />
        <path className="reference-scan-band" d="M-350 1090 L260 40 L480 40 L-130 1090 Z" />
      </g>
      <path d={RUSSIA_OUTLINE_PATH} className="reference-edge" />

      <g aria-hidden="true">
        {events.map((event, index) => {
          const route = routeFor(event, index)
          const selected = event.id === selectedId
          const kind = kindClass[event.kind]
          const id = `ref-route-${event.id}`
          return (
            <g
              key={event.id}
              className={`reference-route-group ${kind}${selected ? ' is-selected' : ''}`}
            >
              <path id={id} d={route.path} className="reference-route" />
              <circle
                cx={route.origin.x}
                cy={route.origin.y}
                r={selected ? 7 : 4}
                className="reference-origin"
              />
              <circle
                cx={route.target.x}
                cy={route.target.y}
                r={selected ? 10 : 6}
                className="reference-impact"
                filter="url(#node-glow)"
              />
              <circle className="reference-packet" r={selected ? 8 : 5.5}>
                <animateMotion
                  dur={`${2.8 + (index % 3) * 0.55}s`}
                  begin={`${-index * 0.62}s`}
                  repeatCount="indefinite"
                >
                  <mpath href={`#${id}`} />
                </animateMotion>
              </circle>
              <circle className="reference-packet reference-packet-secondary" r="3.4">
                <animateMotion
                  dur={`${3.7 + (index % 2) * 0.8}s`}
                  begin={`${-1.2 - index * 0.43}s`}
                  repeatCount="indefinite"
                >
                  <mpath href={`#${id}`} />
                </animateMotion>
              </circle>
            </g>
          )
        })}
      </g>

      <g className="reference-city-nodes">
        {SHOWCASE_CITY_NODES.map((city, index) => (
          <g key={city.id} transform={`translate(${city.x} ${city.y})`}>
            <circle
              r="24"
              className="reference-city-ring"
              style={{ animationDelay: `${-index * 0.48}s` }}
            />
            <circle
              r="8"
              className="reference-city-halo"
              filter="url(#node-glow)"
            />
            <circle r="3.3" className="reference-city-core" />
          </g>
        ))}
      </g>
    </svg>
  )
}
