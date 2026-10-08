import { kindClass, type ShellEvent } from '../events/snapshot'

export function EventInspector({ selected }: { selected?: ShellEvent }) {
  const fields = selected
    ? [
        ['Scenario timestamp', selected.timestamp],
        ['Synthetic source node', selected.source],
        ['City display node', selected.target],
        ['Synthetic severity', selected.severity],
        ['Fixture confidence', selected.confidence],
        ['Provenance', 'Synthetic fixture v1'],
        ['Simulation state', 'Simulated / animated'],
      ]
    : []

  return (
    <section className="panel inspector" aria-labelledby="inspector-title">
      <div className="panel-heading">
        <h2 id="inspector-title">Event inspector</h2>
        <span>{selected?.id ?? '—'}</span>
      </div>
      {selected ? (
        <>
          <p className={`inspector-kind ${kindClass[selected.kind]}`}>
            {selected.kind}
          </p>
          <dl>
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="help">
            City names are public geographic labels only. Nodes, events and
            incidents are fictional.
          </p>
        </>
      ) : (
        <p className="help" role="status">
          No simulated event selected.
        </p>
      )}
    </section>
  )
}
