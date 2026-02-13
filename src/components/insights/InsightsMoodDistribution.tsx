import type { CSSProperties } from 'react'
import type { Entry } from '../../lib/entries'

type InsightsMoodDistributionProps = {
  entries: Entry[]
  moodColors: string[]
  goToLog: () => void
}

export const InsightsMoodDistribution = ({
  entries,
  moodColors,
  goToLog,
}: InsightsMoodDistributionProps) => {
  const moodLabels = ['Very low', 'Low', 'Okay', 'Good', 'Great']
  const moodCounts = entries.reduce(
    (acc, entry) => {
      const mood = Number(entry.mood)
      if (!Number.isFinite(mood)) return acc
      const clamped = Math.min(5, Math.max(1, Math.round(mood)))
      acc[clamped - 1] += 1
      return acc
    },
    [0, 0, 0, 0, 0] as number[],
  )
  const total = moodCounts.reduce((sum, value) => sum + value, 0)

  let cumulative = 0
  const segments = moodCounts.map((count, index) => {
    const portion = total ? (count / total) * 100 : 0
    const start = cumulative
    cumulative += portion
    return `${moodColors[index]} ${start}% ${cumulative}%`
  })

  const pieStyle: CSSProperties = total
    ? { background: `conic-gradient(${segments.join(', ')})` }
    : { background: 'conic-gradient(var(--mood-ring-track) 0)' }

  return (
    <section className="card mood-distribution-card">
      <div className="card-header">
        <div>
          <h2>
            Mood distribution
          </h2>
          <p className="muted">Mood distribution across your entries</p>
        </div>
      </div>
      {total
        ? (
            <div className="mood-distribution">
              <div className="mood-pie" style={pieStyle} aria-hidden="true" />
              <div className="mood-legend">
                <p className="mood-total">
                  <span className="label">Total logs</span>
                  <span className="value">{total}</span>
                </p>
                {moodCounts.map((count, index) => {
                  const percent = total ? Math.round((count / total) * 100) : 0
                  return (
                    <div className="mood-legend-row" key={`mood-${index + 1}`}>
                      <span
                        className="mood-legend-swatch"
                        style={{ '--swatch-color': moodColors[index] } as CSSProperties}
                        aria-hidden="true"
                      />
                      <span className="mood-legend-label">{moodLabels[index]}</span>
                      <span className="mood-legend-metrics">
                        <span className="mood-legend-value">{count}</span>
                        <span className="mood-legend-separator" aria-hidden="true">·</span>
                        <span className="mood-legend-percent">{`${percent}%`}</span>
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        : (
            <p className="muted">
              <button type="button" className="link-button link-button--text" onClick={goToLog}>
                Log a day
              </button>
              {' '}to see your mood distribution.
            </p>
          )}
    </section>
  )
}
