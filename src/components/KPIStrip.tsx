import { countLabel, type ShellEvent } from '../events/snapshot'

export function KPIStrip({ events }: { events: readonly ShellEvent[] }) {
  const count = (kind: ShellEvent['kind']) =>
    countLabel(events.filter((event) => event.kind === kind).length)
  const kpis = [
    ['Scenario', 'City Mesh / 01'],
    ['Loop mode', 'AUTO'],
    ['Synthetic events', countLabel(events.length)],
    ['Synthetic SCAN', count('SCAN')],
    ['Synthetic DDOS', count('DDOS')],
    ['Synthetic EXPLOIT', count('EXPLOIT_ATTEMPT')],
    ['City nodes', '05'],
  ]
  return (
    <section className="kpi-strip" aria-label="Simulation KPIs">
      {kpis.map(([label, value], index) => (
        <div className={`kpi kpi-${index}`} key={label}>
          <p>{label}</p>
          <strong>{value}</strong>
          <span>
            {index === 0
              ? 'Synthetic city scenario'
              : index === 1
                ? 'Continuous visual loop'
                : 'Portfolio demo fixture'}
          </span>
        </div>
      ))}
    </section>
  )
}
