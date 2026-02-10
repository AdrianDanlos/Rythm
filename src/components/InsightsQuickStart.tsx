type InsightsQuickStartProps = {
  goToLog: () => void
  hasNoEntries: boolean
}

export const InsightsQuickStart = ({ goToLog, hasNoEntries }: InsightsQuickStartProps) => {
  if (!hasNoEntries) return null

  return (
    <section className="card insights-intro">
      <div className="insights-intro__header">
        <div>
          <p className="eyebrow">Quick start</p>
          <h2>See how your life affects your sleep and mood</h2>
        </div>
      </div>
      <div className="insights-intro__steps">
        <div className="intro-step">
          <span className="intro-step__number">1</span>
          <p>Log how much you slept last night.</p>
        </div>
        <div className="intro-step">
          <span className="intro-step__number">2</span>
          <p>Log events that happened during the day (e.g. coffee, workout, late night, stress).</p>
        </div>
        <div className="intro-step">
          <span className="intro-step__number">3</span>
          <p>Rate how you're feeling. The more days you log, the more insights you'll see.</p>
        </div>
      </div>
      <div className="insights-intro__actions">
        <button
          className="primary-button cta-button"
          type="button"
          onClick={goToLog}
        >
          Log today
        </button>
      </div>
    </section>
  )
}
