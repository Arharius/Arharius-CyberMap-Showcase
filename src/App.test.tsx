import { snapshot, presentEvents } from './events/snapshot'
import { createUIStore, FILTERS, filterKind } from './state/uiStore'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { App, DirectorScreen, SIMULATION_DISCLOSURE } from './App'

const disclosure = 'SIMULATED — NOT REAL ATTACK DATA'

describe('CyberMap portfolio showcase', () => {
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
      expect(markup).toContain('AUTONOMOUS LOOP')
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
    expect(markup).toContain('AUTO / SYNTHETIC LOOP')
    expect(markup).toContain('SYNTHETIC EVENTS ACTIVE')
  })

  it('renders five public city labels and no real organizations', () => {
    const markup = renderToStaticMarkup(<App />)
    for (const city of [
      'Moscow',
      'Saint Petersburg',
      'Saratov',
      'Vladivostok',
      'Murmansk',
    ]) {
      expect(markup).toContain(city)
    }
    expect(markup).toContain('SYNTHETIC NODE')
    expect(markup).toContain('NO REAL TARGETS · NO REAL INFRASTRUCTURE')
    expect(markup).not.toMatch(/Roscosmos|Роскосмос|Прогресс|Progress|НПО|NPO/)
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
    expect(markup).toContain('Synthetic source node</dt><dd>Synthetic Edge 01')
    expect(markup).toContain('City display node</dt><dd>Moscow')
    expect(markup).toContain('Synthetic fixture v1')
    expect(markup).toContain('Simulated / animated')
  })

  it('uses inline animated SVG geometry without remote map resources or playback sliders', () => {
    const markup = renderToStaticMarkup(<App />)
    expect(markup).toContain('<svg')
    expect(markup).toContain('Animated synthetic city-node scenario')
    expect(markup).toContain('showcase-route')
    expect(markup).toContain('<animateMotion')
    expect(markup).toContain('class="city-pulse city-pulse-outer"')
    expect(markup).not.toContain('type="range"')
    expect(markup).not.toContain('Resume simulation')
    expect(markup).not.toContain('Replay')
    expect(markup).not.toMatch(/(?:src|href)="(?:https?:)?\/\//i)
  })
})

describe('showcase state combinations', () => {
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
          expect(
            markup.match(/class="showcase-route /g) ?? [],
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
        }
      }
    },
  )

  it('retains disclosure through presentation, filtering and selection changes', () => {
    const store = createUIStore()
    const render = () =>
      renderToStaticMarkup(
        <DirectorScreen records={snapshot} state={store.getState()} />,
      )

    const changes = [
      () => store.getState().setPresentation(true),
      () => store.getState().setFilter('RECON'),
      () => store.getState().setSelectedId('SYN-001'),
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
