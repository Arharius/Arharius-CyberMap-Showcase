import { useEffect, useState } from 'react'
import { useStore } from 'zustand'
import { createUIStore, filterKind, type UIState } from './state/uiStore'
import type { CyberEvent } from './events/schema'
import { snapshot, presentEvents } from './events/snapshot'
import { SimulationDisclosure } from './components/SimulationDisclosure'
import { KPIStrip } from './components/KPIStrip'
import { Filters } from './components/Filters'
import { MapOverview } from './components/MapOverview'
import { SimulatedEventFeed } from './components/SimulatedEventFeed'
import { EventInspector } from './components/EventInspector'
import { TimelineControls } from './components/TimelineControls'
import './styles.css'

export { SIMULATION_DISCLOSURE } from './components/SimulationDisclosure'

/** Own the UI store once; the public showcase advances selection automatically. */
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
    }, 2200)

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
  const { presentation, setPresentation, filter, selectedId, setSelectedId } =
    state
  const events = presentEvents(records)
  const visibleEvents = events.filter(
    (event) => filter === 'ALL' || event.kind === filterKind[filter],
  )
  const selected =
    visibleEvents.find((event) => event.id === selectedId) ?? visibleEvents[0]

  return (
    <>
      <SimulationDisclosure />
      <main className={`app-shell${presentation ? ' presentation' : ''}`}>
        <header className="header">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              ◈
            </span>
            <div>
              <h1 id="page-title">CyberMap</h1>
              <p>
                PORTFOLIO SHOWCASE <span>/</span> SYNTHETIC CITY NETWORK
              </p>
            </div>
          </div>
          <div className="header-actions">
            <span className="demo-badge">DEMO / SYNTHETIC</span>
            <span className="snapshot-label auto-label">AUTONOMOUS LOOP</span>
            <button
              aria-pressed={presentation}
              onClick={() => setPresentation(!presentation)}
            >
              {presentation ? 'Exit presentation' : 'Presentation view'}
            </button>
          </div>
        </header>
        <KPIStrip events={events} />
        <div className="director-grid">
          <Filters state={state} events={events} />
          <MapOverview
            displayEvents={events.map((event) => event.display)}
            filter={filter}
            selectedId={selected?.id ?? null}
          />
          <aside className="right-column" aria-label="Synthetic event details">
            <SimulatedEventFeed
              visibleEvents={visibleEvents}
              selected={selected}
              setSelectedId={setSelectedId}
            />
            <EventInspector selected={selected} />
          </aside>
        </div>
        <TimelineControls />
      </main>
    </>
  )
}
