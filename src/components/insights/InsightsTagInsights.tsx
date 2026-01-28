import type { TagInsight } from '../../lib/types/stats'

type InsightsTagInsightsProps = {
  isPro: boolean
  tagInsights: TagInsight[]
  onOpenPaywall: () => void
}

export const InsightsTagInsights = ({
  isPro,
  tagInsights,
  onOpenPaywall,
}: InsightsTagInsightsProps) => (
  <section className={`card ${!isPro ? 'pro-locked' : ''}`}>
    <div className="card-header">
      <div>
        <h2>Tag insights</h2>
        <p className="muted">Sleep and Mood by tag</p>
      </div>
    </div>
    {!isPro
      ? (
          <div className="locked-message">
            <p className="muted">Upgrade to Pro to see tag insights.</p>
            <button type="button" className="ghost" onClick={onOpenPaywall}>
              Upgrade to Pro
            </button>
          </div>
        )
      : tagInsights.length
        ? (
            <div className="tag-grid">
              {tagInsights.slice(0, 8).map(tag => (
                <div className="tag-card" key={tag.tag}>
                  <p className="tag-title">{tag.tag}</p>
                  <p className="helper">
                    {tag.count} entries · {tag.sleep?.toFixed(1) ?? '—'}h /{' '}
                    {tag.mood?.toFixed(1) ?? '—'}
                  </p>
                </div>
              ))}
            </div>
          )
        : (
            <p className="muted">Add tags to see insights.</p>
          )}
  </section>
)
