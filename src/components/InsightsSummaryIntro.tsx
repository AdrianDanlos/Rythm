type InsightsSummaryIntroProps = {
  entryCount: number
  entriesLoading: boolean
}

export const InsightsSummaryIntro = ({ entryCount, entriesLoading }: InsightsSummaryIntroProps) => {
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
        Here you can see your Rhythm score and streak, plus how your sleep, mood, and what happens during the day affect each other. Log more days to get clearer insights and unlock special badges.
      </p>
    </section>
  )
}
