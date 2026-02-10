import { formatSleepHours } from '../../lib/utils/sleepHours'

type IdeaSleepTargetTeaserProps = {
  onOpenPaywall: () => void
}

const MOCK_THRESHOLD = 7.5
const MOCK_MOOD_HIGH = 3.8
const MOCK_MOOD_LOW = 3.1

export const IdeaSleepTargetTeaser = ({ onOpenPaywall }: IdeaSleepTargetTeaserProps) => (
  <div className="ideal-sleep-target-teaser premium-preview">
    <div className="premium-preview__blur">
      <div className="ideal-sleep-target-content">
        <div className="stat-block stat-block--ring stat-block--sleep ideal-sleep-target-ring">
          <div
            className="stat-ring"
            style={{ ['--stat-progress' as string]: '100%' }}
          >
            <div className="stat-ring__inner">
              <p className="label">Target</p>
              <p className="value">{formatSleepHours(MOCK_THRESHOLD)}</p>
            </div>
          </div>
        </div>
        <div className="ideal-sleep-mood-delta">
          <span className="ideal-sleep-mood-delta__pill ideal-sleep-mood-delta__pill--high">
            ≥{formatSleepHours(MOCK_THRESHOLD)} → {MOCK_MOOD_HIGH.toFixed(1)}
          </span>
          <span className="ideal-sleep-mood-delta__arrow" aria-hidden="true">-</span>
          <span className="ideal-sleep-mood-delta__pill ideal-sleep-mood-delta__pill--low">
            &lt;{formatSleepHours(MOCK_THRESHOLD)} → {MOCK_MOOD_LOW.toFixed(1)}
          </span>
          <span className="ideal-sleep-mood-delta__badge">
            +{(MOCK_MOOD_HIGH - MOCK_MOOD_LOW).toFixed(1)} mood when above target
          </span>
        </div>
      </div>
    </div>
    <div className="premium-preview__overlay">
      <div className="locked-message">
        <button type="button" className="ghost cta-ghost" onClick={onOpenPaywall}>
          Upgrade to Pro
        </button>
      </div>
    </div>
  </div>
)
