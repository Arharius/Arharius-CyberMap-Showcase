export function TimelineControls() {
  return (
    <footer className="panel timeline autoplay-footer" aria-labelledby="timeline-title">
      <div className="timeline-title">
        <div className="timeline-kicker">
          <p className="eyebrow">AUTONOMOUS SHOWCASE</p>
          <span className="static-status live-status">AUTO LOOP</span>
        </div>
        <h2 id="timeline-title">Synthetic scenario playback</h2>
        <span>No operator controls required · continuously animated presentation</span>
      </div>

      <div className="autoplay-strip" aria-label="Autonomous simulated playback active">
        <span className="autoplay-dot" />
        <strong>SYNTHETIC EVENTS ACTIVE</strong>
        <div className="signal-bars" aria-hidden="true">
          {Array.from({ length: 14 }, (_, index) => (
            <i key={index} style={{ animationDelay: `${index * -0.12}s` }} />
          ))}
        </div>
      </div>

      <div className="timeline-end">
        <strong>24 / 7</strong>
        <span>PORTFOLIO DEMO LOOP</span>
      </div>
    </footer>
  )
}
