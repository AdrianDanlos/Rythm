type InsightsSummaryIntroProps = {
  entryCount: number
}

export const InsightsSummaryIntro = ({ entryCount }: InsightsSummaryIntroProps) => {
  if (entryCount > 1) return null

  return (
    <section className="card insights-intro insights-summary-intro">
      <div className="insights-intro__header">
        <div>
          <p className="eyebrow">Summary</p>
          <h2>Your overview at a glance</h2>
        </div>
      </div>
      <p className="insights-summary-intro__copy">
        Here you can see your Rhythm score and streak, plus how your sleep, mood, and daily events affect each other. Log more days to get clearer insights and unlock special badges.
      </p>
    </section>
  )
}
