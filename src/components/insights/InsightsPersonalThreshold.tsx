import { Tooltip } from '../Tooltip'

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
}: InsightsPersonalThresholdProps) => {
  const hasThreshold = typeof personalSleepThreshold === 'number'

  return (
    <section className={`card ${!isPro ? 'pro-locked' : ''}`}>
      <div className="card-header">
        <div>
          <h2>
            Your sleep target
            <Tooltip label="What is this? An estimated sleep goal tied to your best mood days.">
              <span className="tooltip-trigger">
                <span className="tooltip-icon" aria-hidden="true">i</span>
              </span>
            </Tooltip>
          </h2>
          <p className="muted">Personalized target based on your sleep history.</p>
        </div>
      </div>
      {!isPro
        ? (
            <div className="locked-message">
              <p className="muted">
                Instead of using the default 8h estimate, finds your ideal target sleep time.
              </p>
              <button type="button" className="ghost cta-ghost" onClick={onOpenPaywall}>
                Upgrade to Pro
              </button>
            </div>
          )
        : hasThreshold
          ? (
              <div className="stat-block">
                <p className="label">Estimated threshold</p>
                <p className="value">{`${personalSleepThreshold}h`}</p>
                <p className="helper">
                  Avg mood at ≥{personalSleepThreshold}h:{' '}
                  {moodByPersonalThreshold.high?.toFixed(1) ?? '—'} · &lt;
                  {personalSleepThreshold}h:{' '}
                  {moodByPersonalThreshold.low?.toFixed(1) ?? '—'}
                </p>
              </div>
            )
          : (
              <div className="stat-block">
                <p className="muted">
                  Not enough data yet. Log more sleep entries to estimate your
                  personal threshold.
                </p>
              </div>
            )}
    </section>
  )
}
