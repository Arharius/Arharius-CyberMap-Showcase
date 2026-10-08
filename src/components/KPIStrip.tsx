import { countLabel, type ShellEvent } from '../events/snapshot'

export function KPIStrip({ events }: { events: readonly ShellEvent[] }) {
  const count = (kind: ShellEvent['kind']) =>
    countLabel(events.filter((event) => event.kind === kind).length)
  const kpis = [
    ['Scenario', 'Atlas / 01'],
    ['Scenario time', '00:04:32'],
    ['Simulated events', countLabel(events.length)],
    ['Simulated SCAN', count('SCAN')],
    ['Simulated DDOS', count('DDOS')],
    ['Simulated EXPLOIT', count('EXPLOIT_ATTEMPT')],
    ['Static visual marks', countLabel(events.length)],
  ]
  return (
    <section className="kpi-strip" aria-label="Simulation KPIs">
      {kpis.map(([label, value], index) => (
        <div className={`kpi kpi-${index}`} key={label}>
          <p>{label}</p>
          <strong>{value}</strong>
          <span>
            {index === 0
              ? 'Synthetic Atlas study'
              : index === 1
                ? 'Local scenario clock'
                : 'Static demo fixture'}
          </span>
        </div>
      ))}
    </section>
  )
}
