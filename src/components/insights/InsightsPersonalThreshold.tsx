type InsightsPersonalThresholdProps = {
  isPro: boolean
  personalSleepThreshold: number | null
  moodByPersonalThreshold: { high: number | null, low: number | null }
  onOpenPaywall: () => void
}

export const InsightsPersonalThreshold = ({
  isPro,
  personalSleepThreshold,
  moodByPersonalThreshold,
  onOpenPaywall,
}: InsightsPersonalThresholdProps) => (
  <section className={`card ${!isPro ? 'pro-locked' : ''}`}>
    <div className="card-header">
      <div>
        <h2>Your sleep threshold</h2>
        <p className="muted">Personalized sleep target</p>
      </div>
    </div>
    {!isPro
      ? (
          <div className="locked-message">
            <p className="muted">
              Upgrade to Pro to see your personal threshold.
            </p>
            <button type="button" className="ghost" onClick={onOpenPaywall}>
              Upgrade to Pro
            </button>
          </div>
        )
      : (
          <div className="stat-block">
            <p className="label">Estimated threshold</p>
            <p className="value">
              {personalSleepThreshold ? `${personalSleepThreshold}h` : '—'}
            </p>
            <p className="helper">
              Avg mood at ≥{personalSleepThreshold ?? '—'}h:{' '}
              {moodByPersonalThreshold.high?.toFixed(1) ?? '—'} · &lt;
              {personalSleepThreshold ?? '—'}h:{' '}
              {moodByPersonalThreshold.low?.toFixed(1) ?? '—'}
            </p>
          </div>
        )}
  </section>
)
