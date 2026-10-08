import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Map, type MapOptions, type StyleSpecification } from 'maplibre-gl'
import { MapboxOverlay } from '@deck.gl/mapbox'
import 'maplibre-gl/dist/maplibre-gl.css'
import { buildLayers, type DisplayEvent } from './buildLayers'
import type { Filter } from '../state/uiStore'

/** Inline geometry only; no tiles, sprites, glyphs, terrain or remote style. */
export function offlineStyle(): StyleSpecification {
  const lines: number[][][] = []
  for (let lon = -180; lon <= 180; lon += 30) lines.push([[lon, -80], [lon, 80]])
  for (let lat = -60; lat <= 60; lat += 30) lines.push([[-180, lat], [0, lat], [180, lat]])
  return {
    version: 8, projection: { type: 'mercator' },
    sources: { grid: { type: 'geojson', data: {
      type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: lines },
    } } },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': '#0b1723' } },
      { id: 'grid', type: 'line', source: 'grid', paint: { 'line-color': '#304a5c', 'line-width': 0.6 } },
    ],
  }
}
export function offlineMapOptions(container: HTMLElement): MapOptions {
  return {
    container, style: offlineStyle(), center: [0, 15], zoom: 0.6,
    minZoom: 0, maxZoom: 4, maxPitch: 0, renderWorldCopies: false,
    attributionControl: false, interactive: false, fadeDuration: 0,
    // Fail closed if a future style change introduces any resource request.
    transformRequest: () => { throw new Error('Offline map forbids resource requests') },
  }
}

export function MapStage({ events, filter, selectedId, children }: {
  events: readonly DisplayEvent[]; filter: Filter; selectedId: string | null; children: ReactNode
}) {
  const container = useRef<HTMLDivElement>(null)
  const overlay = useRef<MapboxOverlay | null>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (!container.current) return
    let map: Map | undefined
    let observer: ResizeObserver | undefined
    try {
      map = new Map(offlineMapOptions(container.current))
      overlay.current = new MapboxOverlay({ interleaved: false, layers: [] })
      map.addControl(overlay.current)
      map.on('load', () => setReady(true))
      map.on('error', () => setReady(false))
      observer = new ResizeObserver(() => map?.resize())
      observer.observe(container.current)
    } catch {
      setReady(false)
    }
    return () => {
      observer?.disconnect()
      map?.remove()
      overlay.current = null
    }
  }, [])
  useEffect(() => {
    overlay.current?.setProps({ layers: buildLayers(events, filter, selectedId) })
  }, [events, filter, selectedId])
  return <div className="offline-map">
    {/* Static decoration: also exclude deck.gl's injected canvas from keyboard focus. */}
    <div ref={container} className="mercator-map" aria-hidden="true" inert style={{ visibility: ready ? 'visible' : 'hidden' }} />
    <div className={ready ? 'map-description-only' : ''}>{children}</div>
    {ready && <span className="map-description-only">Offline procedural Mercator grid. Static simulated categories; display geography only.</span>}
  </div>
}
