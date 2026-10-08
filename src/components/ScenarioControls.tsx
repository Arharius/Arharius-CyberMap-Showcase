import type { UIState } from '../state/uiStore'

export function ScenarioControls({
  scenario,
  setScenario,
  seed,
  setSeed,
}: Pick<UIState, 'scenario' | 'setScenario' | 'seed' | 'setSeed'>) {
  return (
    <div className="control-section">
      <label htmlFor="scenario">SCENARIO</label>
      <select
        id="scenario"
        value={scenario}
        onChange={() => setScenario('atlas')}
      >
        <option value="atlas">Atlas / synthetic study 01</option>
      </select>
      <div className="seed">
        <label htmlFor="seed">Fixture seed</label>
        <input
          id="seed"
          type="number"
          min="0"
          max="4294967295"
          step="1"
          value={seed}
          onChange={(event) => setSeed(event.currentTarget.valueAsNumber)}
        />
      </div>
      <button className="wide" onClick={() => setSeed(42)}>
        Reset seed · preview
      </button>
      <p className="help">
        Scenario and seed controls are staged; the snapshot remains static.
      </p>
    </div>
  )
}
