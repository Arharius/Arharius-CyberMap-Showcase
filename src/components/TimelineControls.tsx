export function TimelineControls() {
  return (
    <footer className="panel timeline" aria-labelledby="timeline-title">
      <div className="timeline-title">
        <div className="timeline-kicker">
          <p className="eyebrow">SCENARIO CONTROLS</p>
          <span className="static-status">STATIC</span>
        </div>
        <h2 id="timeline-title">Simulation timeline</h2>
        <span>Static preview · playback deferred</span>
      </div>
      <div className="playback">
        <button disabled aria-label="Resume simulation (static preview)">
          ▶ Resume
        </button>
        <button disabled>↺ Replay</button>
      </div>
      <div className="timeline-track" aria-label="Static scenario position">
        <label htmlFor="timeline">
          Atlas / 01 <span>00:04:32 / 00:06:00</span>
        </label>
        <input
          id="timeline"
          type="range"
          min="0"
          max="360"
          value="272"
          disabled
        />
        <div className="timeline-marker" aria-hidden="true">
          <i />
        </div>
        <div className="range-label">
          <span>00:00</span>
          <span>02:00</span>
          <span>04:00</span>
          <span>06:00</span>
        </div>
      </div>
      <div className="timeline-end">
        <strong>01 / 01</strong>
        <span>SYNTHETIC SCENARIO</span>
      </div>
    </footer>
  )
}
