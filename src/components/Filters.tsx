import { FILTERS as filters, filterKind, type UIState } from '../state/uiStore'
import { countLabel, type ShellEvent } from '../events/snapshot'
import { EVENT_KINDS } from '../events/schema'
import { ScenarioControls } from './ScenarioControls'

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
        <h2 id="controls-title">Display controls</h2>
        <span>01</span>
      </div>
      <p className="field-label">SIMULATED CATEGORIES</p>
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
        RECON displays SCAN. EXPLOIT displays EXPLOIT_ATTEMPT. All categories
        are simulated.
      </p>
      <ScenarioControls {...state} />
      <div className="control-section">
        <label htmlFor="rate">EVENT RATE · STATIC PREVIEW</label>
        <input id="rate" type="range" min="0" max="100" value="35" disabled />
        <div className="range-label">
          <span>Sparse</span>
          <span>Dense</span>
        </div>
        <p className="field-label">FIXTURE EVENT MIX</p>
        <div className="mix-bar" aria-label={mixLabel}>
          {mix.map(([kind, percent]) => (
            <i key={kind} style={{ width: `${percent}%` }} />
          ))}
        </div>
        <p className="help">{mixLabel}</p>
      </div>
      <div className="diagnostics">
        <span className="status-dot" /> Offline procedural display
        <p>
          {events.length} normalized synthetic records.
          <br />
          No geographic precision implied.
        </p>
      </div>
    </aside>
  )
}
