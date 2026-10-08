import { snapshot, presentEvents } from './events/snapshot'
import { createUIStore, FILTERS, filterKind } from './state/uiStore'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { App, DirectorScreen, SIMULATION_DISCLOSURE } from './App'

const disclosure = 'SIMULATED — NOT REAL ATTACK DATA'

describe('CyberMap Director Screen', () => {
  it.each([false, true])(
    'keeps the exact disclosure first in presentation=%s',
    (presentation) => {
      const markup = renderToStaticMarkup(
        <App initialPresentation={presentation} />,
      )

      expect(SIMULATION_DISCLOSURE).toBe(disclosure)
      expect(
        markup.startsWith(`<p class="disclosure">${disclosure}</p><main`),
      ).toBe(true)
      expect(markup.split(disclosure)).toHaveLength(2)
      expect(markup).toContain(
        presentation ? 'app-shell presentation' : 'class="app-shell"',
      )
      expect(markup).toContain('DEMO / SYNTHETIC')
    },
  )

  it('renders the major shell landmarks and seven KPI values', () => {
    const markup = renderToStaticMarkup(<App />)

    expect(markup).toContain('<h1 id="page-title">CyberMap</h1>')
    for (const landmark of [
      'controls-title',
      'map-heading',
      'feed-title',
      'inspector-title',
      'timeline-title',
    ]) {
      expect(markup).toContain(`aria-labelledby="${landmark}"`)
      expect(markup).toContain(`id="${landmark}"`)
    }
    expect(markup).toContain('aria-label="Simulation KPIs"')
    expect(markup.match(/class="kpi kpi-\d"/g)).toHaveLength(7)
    expect(markup).toContain('aria-label="Simulated category legend"')
    expect(markup).toContain('id="scenario"')
    expect(markup).toContain('Fixture seed')
    expect(markup).toContain('id="timeline"')
  })

  it('renders deterministic synthetic records newest first with a matching inspector', () => {
    const markup = renderToStaticMarkup(<App />)
    expect(renderToStaticMarkup(<App />)).toBe(markup)
    expect(markup.match(/class="event (?:scan|ddos|exploit)"/g)).toHaveLength(6)
    expect(markup.match(/class="event-meta">SIMULATED/g)).toHaveLength(6)
    const ids = [
      'SYN-006',
      'SYN-005',
      'SYN-004',
      'SYN-003',
      'SYN-002',
      'SYN-001',
    ]
    ids.slice(1).forEach((id, index) => {
      expect(markup.indexOf(ids[index])).toBeLessThan(markup.indexOf(id))
    })
    expect(markup).toContain('Source display zone</dt><dd>Zone C')
    expect(markup).toContain('Target display zone</dt><dd>Zone F')
    expect(markup).toContain('Synthetic fixture v1')
    expect(markup).toContain('Simulated / static')
  })

  it('uses inline geometry and clearly marks deferred playback', () => {
    const markup = renderToStaticMarkup(<App />)
    expect(markup).toContain('<svg')
    expect(markup).toContain('Offline procedural world silhouette')
    expect(markup).toContain('Static preview · playback deferred')
    expect(markup).toContain('class="static-status">STATIC</span>')
    expect(markup).toContain('aria-label="Static scenario position"')
    expect(markup).toContain('class="timeline-marker" aria-hidden="true"')
    expect(markup).toContain(
      'disabled="" aria-label="Resume simulation (static preview)"',
    )
    expect(markup).not.toMatch(/(?:src|href)="(?:https?:)?\/\//i)
    expect(markup).not.toMatch(
      /\b(?:breach(?:ed)?|compromised|live feed|provider)\b/i,
    )
  })

  it('keeps the decorative WebGL subtree inert without hiding the accessible map description', () => {
    const markup = renderToStaticMarkup(<App />)
    // aria-hidden alone does not exclude deck.gl's injected tabindex=0 canvas.
    expect(markup).toMatch(/<div class="mercator-map" aria-hidden="true" inert=""[^>]*><\/div><div class=""><svg/)
    expect(markup).toContain('aria-labelledby="map-title map-description"')
    expect(markup).toContain('id="map-description"')
  })
})

// Re-render the same store after transitions; effects/WebGL stay outside SSR tests.
describe('Phase-1 state combinations', () => {
  it.each([false, true])(
    'keeps disclosure and landmarks with empty/data-light records, presentation=%s',
    (presentation) => {
      for (const records of [[], snapshot.slice(0, 1)]) {
        const store = createUIStore(presentation)
        for (const filter of FILTERS) {
          store.getState().setFilter(filter)
          const markup = renderToStaticMarkup(
            <DirectorScreen records={records} state={store.getState()} />,
          )
          expect(
            markup.startsWith(`<p class="disclosure">${disclosure}</p><main`),
          ).toBe(true)
          for (const landmark of [
            'controls-title',
            'map-heading',
            'feed-title',
            'inspector-title',
            'timeline-title',
          ]) {
            expect(markup).toContain(`aria-labelledby="${landmark}"`)
          }
          const expected = records.filter(
            (event) =>
              filter === 'ALL' || event.event_kind === filterKind[filter],
          )
          expect(
            markup.match(/class="event-meta">SIMULATED/g) ?? [],
          ).toHaveLength(expected.length)
          const fallback = markup.slice(
            markup.indexOf('<svg'),
            markup.indexOf('</svg>'),
          )
          expect(
            fallback.match(/class="(?:route [^"]+|warning-ring)"/g) ?? [],
          ).toHaveLength(expected.length)
          if (!expected.length) {
            expect(markup).toContain('No simulated events match this view.')
            expect(markup).toContain('No simulated event selected.')
            expect(markup).not.toContain('Synthetic fixture v1')
          }
          expect(markup).toContain(
            '<p>Simulated events</p><strong>' +
              String(records.length).padStart(2, '0'),
          )
          expect(markup).toContain(
            'disabled="" aria-label="Resume simulation (static preview)"',
          )
        }
      }
    },
  )

  it('retains disclosure through presentation, filtering, selection and staged scenario changes', () => {
    const store = createUIStore()
    const render = () =>
      renderToStaticMarkup(
        <DirectorScreen records={snapshot} state={store.getState()} />,
      )
    const changes = [
      () => store.getState().setPresentation(true),
      () => store.getState().setFilter('RECON'),
      () => store.getState().setSelectedId('SYN-001'),
      () => store.getState().setScenario('atlas'),
      () => store.getState().setSeed(100),
      () => store.getState().setPresentation(false),
    ]
    for (const change of changes) {
      change()
      expect(
        render().startsWith(`<p class="disclosure">${disclosure}</p><main`),
      ).toBe(true)
    }
    store.getState().setSelectedId('SYN-001')
    expect(render()).toContain(
      '<span>SYN-001</span></div><p class="inspector-kind scan">SCAN',
    )
    store.getState().setSelectedId('missing')
    expect(render()).toContain(
      '<span>SYN-005</span></div><p class="inspector-kind scan">SCAN',
    )
    expect(presentEvents(snapshot)).toEqual(presentEvents(snapshot))
  })
})
