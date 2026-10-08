import { describe, expect, it, vi } from 'vitest'
import { offlineMapOptions, offlineStyle } from './MapStage'
import { buildLayers, type DisplayEvent } from './buildLayers'

const events: DisplayEvent[] = ['SCAN', 'DDOS', 'EXPLOIT_ATTEMPT'].map((kind, index) => ({
  id: String(index), kind: kind as DisplayEvent['kind'], source: [-30, 20], target: [40, -10],
}))

describe('offline map boundary', () => {
  it('uses only inline geometry and a Mercator style without remote asset hooks', () => {
    const style = offlineStyle()
    expect(style.projection).toEqual({ type: 'mercator' })
    expect(style).not.toHaveProperty('glyphs')
    expect(style).not.toHaveProperty('sprite')
    expect(style).not.toHaveProperty('terrain')
    expect(style.layers.map(layer => layer.type)).toEqual(['background', 'line'])
    for (const source of Object.values(style.sources)) {
      expect(source.type).toBe('geojson')
      expect(source).not.toHaveProperty('url')
      expect(source).not.toHaveProperty('tiles')
      expect(source).toHaveProperty('data.type', 'Feature')
    }
    expect(JSON.stringify(style)).not.toMatch(/https?:|\/\/|\.pbf|\.png/)
  })
  it('blocks every attempted map resource before transport', () => {
    const fetchSpy = vi.fn(() => { throw new Error('network used') })
    vi.stubGlobal('fetch', fetchSpy)
    try {
      const options = offlineMapOptions({} as HTMLElement)
      expect(options.interactive).toBe(false)
      for (const url of ['https://example.invalid/tile', '/font.pbf', 'data:application/json,{}']) {
        expect(() => options.transformRequest!(url)).toThrow('Offline map forbids resource requests')
      }
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally { vi.unstubAllGlobals() }
  })
  it('selects typed static layers and shares filter semantics', () => {
    const layers = buildLayers(events, 'ALL', '2')
    expect(layers.map(layer => layer.constructor.name)).toEqual(['LineLayer', 'ArcLayer', 'ScatterplotLayer'])
    for (const [filter, kind] of [['RECON', 'SCAN'], ['DDOS', 'DDOS'], ['EXPLOIT', 'EXPLOIT_ATTEMPT']] as const) {
      const [layer] = buildLayers(events, filter, null)
      expect(layer.id).toBe(`simulated-${kind}`)
      expect(layer.props.data).toEqual(events.filter(event => event.kind === kind))
      expect(layer.props.transitions).toBeNull()
    }
    expect(buildLayers([], 'ALL', null).every(layer => (layer.props.data as DisplayEvent[]).length === 0)).toBe(true)
  })
})
