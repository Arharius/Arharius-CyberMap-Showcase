import { kindClass, type ShellEvent } from '../events/snapshot'

export function SimulatedEventFeed({
  visibleEvents,
  selected,
  setSelectedId,
}: {
  visibleEvents: readonly ShellEvent[]
  selected?: ShellEvent
  setSelectedId: (id: string) => void
}) {
  return (
    <section className="panel feed" aria-labelledby="feed-title">
      <div className="panel-heading">
        <h2 id="feed-title">Simulated event feed</h2>
        <span>{String(visibleEvents.length).padStart(2, '0')}</span>
      </div>
      <p className="section-note">Static fixture / newest first</p>
      <div className="event-list">
        {visibleEvents.length === 0 && (
          <p className="help" role="status">
            No simulated events match this view.
          </p>
        )}
        {visibleEvents.map((event) => (
          <button
            key={event.id}
            className={`event ${kindClass[event.kind]}`}
            aria-pressed={selected?.id === event.id}
            onClick={() => setSelectedId(event.id)}
          >
            <span className="event-top">
              <strong>{event.kind}</strong>
              <time>{event.timestamp}</time>
            </span>
            <span className="event-route">
              {event.source}
              <span aria-hidden="true"> → </span>
              {event.target}
            </span>
            <span className="event-meta">
              SIMULATED <span>{event.id}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
