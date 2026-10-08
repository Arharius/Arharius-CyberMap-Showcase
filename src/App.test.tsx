import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { App, DirectorScreen, SIMULATION_DISCLOSURE } from './App'
import { snapshot } from './events/snapshot'
import { createUIStore } from './state/uiStore'

const disclosure = 'SIMULATED — NOT REAL ATTACK DATA'

describe('CyberMap portfolio showcase v2', () => {
  it('keeps the safety disclosure first and renders the reference-driven shell', () => {
    const markup = renderToStaticMarkup(<App />)

    expect(SIMULATION_DISCLOSURE).toBe(disclosure)
    expect(markup.startsWith(`<p class="disclosure">${disclosure}</p><main`)).toBe(true)
    expect(markup).toContain('class="reference-shell"')
    expect(markup).toContain('<h1>CyberMap</h1>')
    expect(markup).toContain('INTERACTIVE CYBERSECURITY VISUALIZATION')
    expect(markup).toContain('AUTONOMOUS SYNTHETIC LOOP')
    expect(markup).toContain('SYNTHETIC RUSSIA SCENARIO')
  })

  it('renders detailed presentation geometry, animated routes and five safe city labels', () => {
    const markup = renderToStaticMarkup(<App />)

    expect(markup).toContain('class="reference-map-svg"')
    expect(markup).toContain('id="russia-clip"')
    expect(markup).toContain('fill="url(#land-dots)"')
    expect(markup).toContain('class="reference-edge-glow"')
    expect(markup).toContain('class="reference-scan-band"')
    expect(markup).toContain('<animateMotion')

    for (const city of [
      'Москва',
      'Санкт-Петербург',
      'Саратов',
      'Владивосток',
      'Мурманск',
    ]) {
      expect(markup).toContain(city)
    }

    expect(markup).not.toMatch(/Роскосмос|Roscosmos|Прогресс|Progress|НПО|NPO|КБ/)
  })

  it('renders an autonomous incident dock backed by synthetic fixture events', () => {
    const markup = renderToStaticMarkup(<App />)

    expect(markup).toContain('class="reference-incident-dock"')
    expect(markup).toContain('Incident stream')
    expect(markup.match(/class="event (?:scan|ddos|exploit)"/g)).toHaveLength(6)
    expect(markup.match(/class="event-meta">SIMULATED/g)).toHaveLength(6)
    expect(markup).toContain('Synthetic source node')
    expect(markup).toContain('City display node')
    expect(markup).toContain('Simulated / animated')
  })

  it('contains no manual playback slider, attack creation button or remote map resources', () => {
    const markup = renderToStaticMarkup(<App />)

    expect(markup).not.toContain('type="range"')
    expect(markup).not.toContain('Resume simulation')
    expect(markup).not.toContain('Replay')
    expect(markup).not.toContain('Create attack')
    expect(markup).not.toContain('Создать атаку')
    expect(markup).not.toMatch(/(?:src|href)="https?:\/\//i)
  })

  it('keeps empty records safe and non-fictional rather than inventing incidents', () => {
    const store = createUIStore()
    const markup = renderToStaticMarkup(
      <DirectorScreen records={[]} state={store.getState()} />,
    )

    expect(markup).toContain('No simulated events match this view.')
    expect(markup).toContain('No simulated event selected.')
    expect(markup).toContain('CITY NAMES ONLY · ALL EVENTS SYNTHETIC')
    expect(markup).not.toContain('Synthetic fixture v1')
  })

  it('keeps selected fixture identity deterministic', () => {
    const store = createUIStore()
    store.getState().setSelectedId('SYN-002')
    const markup = renderToStaticMarkup(
      <DirectorScreen records={snapshot} state={store.getState()} />,
    )

    expect(markup).toContain('SYN-002')
    expect(markup).toContain('Саратов')
    expect(markup).toContain('DDoS activity')
  })
})
