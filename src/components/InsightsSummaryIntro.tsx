type InsightsSummaryIntroProps = {
  entryCount: number
  entriesLoading: boolean
  goToLog: () => void
}

export const InsightsSummaryIntro = ({ entryCount, entriesLoading, goToLog }: InsightsSummaryIntroProps) => {
  if (entriesLoading || entryCount > 1) return null

  return (
    <section className="card insights-intro insights-summary-intro">
      <div className="insights-intro__header">
        <div>
          <p className="eyebrow">Summary</p>
          <h2>Your overview at a glance</h2>
        </div>
      </div>
      <p className="insights-summary-intro__copy">
        This is where you'll see your Rhythm score, streak, and how your sleep and mood connect.{' '}
        <button type="button" className="link-button link-button--text" onClick={goToLog}>
          Log your first day
        </button>
        {' '}to get started.
      </p>
    </section>
  )
}
