import { FILTERS as filters, filterKind, type UIState } from '../state/uiStore'
import { countLabel, type ShellEvent } from '../events/snapshot'
import { EVENT_KINDS } from '../events/schema'

export function Filters({
  state,
  events,
}: {
  state: UIState
  events: readonly ShellEvent[]
}) {
  const { filter, setFilter } = state
  const mix = EVENT_KINDS.map(
    (kind) =>
      [
        kind,
        events.length
          ? Math.round(
              (events.filter((event) => event.kind === kind).length /
                events.length) *
                100,
            )
          : 0,
      ] as const,
  )
  const mixLabel = mix
    .map(([kind, percent]) => `${percent}% ${kind}`)
    .join(' / ')

  return (
    <aside className="panel controls" aria-labelledby="controls-title">
      <div className="panel-heading">
        <h2 id="controls-title">Display filters</h2>
        <span>AUTO</span>
      </div>

      <p className="field-label">SYNTHETIC CATEGORIES</p>
      <div className="filters">
        {filters.map((value) => (
          <button
            key={value}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {value}
            <span>
              {countLabel(
                events.filter(
                  (event) =>
                    value === 'ALL' || event.kind === filterKind[value],
                ).length,
              )}
            </span>
          </button>
        ))}
      </div>

      <p className="help">
        RECON displays SCAN. EXPLOIT displays EXPLOIT_ATTEMPT. Every event is
        simulated and the visual loop runs automatically.
      </p>

      <div className="control-section">
        <p className="field-label">FIXTURE EVENT MIX</p>
        <div className="mix-bar" aria-label={mixLabel}>
          {mix.map(([kind, percent]) => (
            <i key={kind} style={{ width: `${percent}%` }} />
          ))}
        </div>
        <p className="help">{mixLabel}</p>
      </div>

      <div className="diagnostics">
        <span className="status-dot" /> Animated synthetic display
        <p>
          {events.length} normalized synthetic records.
          <br />
          Five public city labels; zero real target infrastructure.
        </p>
      </div>
    </aside>
  )
}
