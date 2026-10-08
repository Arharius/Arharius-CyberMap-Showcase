import { useEffect, useState } from 'react'
import { useStore } from 'zustand'
import { createUIStore, type UIState } from './state/uiStore'
import type { CyberEvent } from './events/schema'
import { snapshot, presentEvents } from './events/snapshot'
import { SimulationDisclosure } from './components/SimulationDisclosure'
import { MapOverview } from './components/MapOverview'
import { SimulatedEventFeed } from './components/SimulatedEventFeed'
import { EventInspector } from './components/EventInspector'
import './styles.css'

export { SIMULATION_DISCLOSURE } from './components/SimulationDisclosure'

export function App({
  initialPresentation = false,
  records = snapshot,
}: {
  initialPresentation?: boolean
  records?: readonly CyberEvent[]
}) {
  const [store] = useState(() => createUIStore(initialPresentation))

  useEffect(() => {
    const ids = presentEvents(records).map((event) => event.id)
    if (ids.length < 2) return

    const timer = window.setInterval(() => {
      const current = store.getState().selectedId
      const index = Math.max(0, ids.indexOf(current ?? ''))
      store.getState().setSelectedId(ids[(index + 1) % ids.length])
    }, 2400)

    return () => window.clearInterval(timer)
  }, [records, store])

  const state = useStore(store)
  return <DirectorScreen state={state} records={records} />
}

export function DirectorScreen({
  state,
  records,
}: {
  state: UIState
  records: readonly CyberEvent[]
}) {
  const { selectedId, setSelectedId } = state
  const events = presentEvents(records)
  const selected =
    events.find((event) => event.id === selectedId) ?? events[0]

  return (
    <>
      <SimulationDisclosure />
      <main className="reference-shell">
        <header className="reference-header">
          <div className="reference-brand">
            <span className="reference-mark" aria-hidden="true">◈</span>
            <div>
              <h1>CyberMap</h1>
              <p>INTERACTIVE CYBERSECURITY VISUALIZATION</p>
            </div>
          </div>
          <div className="reference-header-status">
            <span className="reference-live-dot" />
            <strong>AUTONOMOUS SYNTHETIC LOOP</strong>
          </div>
        </header>

        <MapOverview
          displayEvents={events.map((event) => event.display)}
          selectedId={selected?.id ?? null}
        />

        <aside className="reference-incident-dock" aria-label="Synthetic incident stream">
          <div className="reference-dock-heading">
            <div>
              <span>SYNTHETIC FEED</span>
              <strong>Incident stream</strong>
            </div>
            <em>{String(events.length).padStart(2, '0')}</em>
          </div>
          <SimulatedEventFeed
            visibleEvents={events}
            selected={selected}
            setSelectedId={setSelectedId}
          />
          <EventInspector selected={selected} />
        </aside>

        <footer className="reference-footer">
          <span>PORTFOLIO SHOWCASE</span>
          <strong>NO REAL ATTACK DATA · NO REAL TARGET INFRASTRUCTURE</strong>
          <span>REACT · TYPESCRIPT · SVG · DETERMINISTIC FIXTURES</span>
        </footer>
      </main>
    </>
  )
}
