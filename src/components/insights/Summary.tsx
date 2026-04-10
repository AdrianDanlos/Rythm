import { motion, type Transition } from 'framer-motion'
import type { Entry } from '../../lib/entries'
import type { StatCounts } from '../../lib/stats'
import type { Badge, SleepMoodAverages, WindowStats } from '../../lib/types/stats'
import { InsightsFirstFiveCard } from './InsightsFirstFiveCard'
import { InsightsFirstTwoCard } from './InsightsFirstTwoCard'
import { InsightsStats } from './InsightsStats'
import { IdeaSleepTarget } from './IdeaSleepTarget'
import { InsightsSummaryIntro } from '../InsightsSummaryIntro'
import rankingBadge1 from '../../assets/badges/ranking-badge_1.png'
import rankingBadge2 from '../../assets/badges/ranking-badge_2.png'
import rankingBadge3 from '../../assets/badges/ranking-badge_3.png'
import rankingBadge4 from '../../assets/badges/ranking-badge_4.png'
import rankingBadge5 from '../../assets/badges/ranking-badge_5.png'
import rankingBadgeLast from '../../assets/badges/ranking-badge_last.png'

export type SummaryProps = {
  reduceMotion: boolean | null
  panelTransition: Transition
  entriesLoading: boolean
  entries: Entry[]
  goToLog: () => void
  isLoading: boolean
  averages: SleepMoodAverages
  windowAverages: {
    last7: WindowStats
    last30: WindowStats
    last90: WindowStats
    last365: WindowStats
  }
  statCounts: StatCounts
  rhythmScore: number | null
  streak: number
  sleepConsistencyLabel: string | null
  sleepConsistencyBadges: Badge[]
  sortedBadges: Badge[]
  correlationLabel: string | null
  correlationDirection: string | null
  moodBySleepThreshold: { high: number | null, low: number | null }
  moodBySleepBucketCounts: { high: number, low: number }
  sleepThreshold: number
  isPro: boolean
  motivationMessage: string
  hasEnoughEntries: boolean
  personalSleepThreshold: number | null
  moodByPersonalThreshold: { high: number | null, low: number | null }
  onOpenPaywall: () => void
  t: (key: string, options?: Record<string, unknown>) => string
}

export const Summary = ({
  reduceMotion,
  panelTransition,
  entriesLoading,
  entries,
  goToLog,
  isLoading,
  averages,
  windowAverages,
  statCounts,
  rhythmScore,
  streak,
  sleepConsistencyLabel,
  sleepConsistencyBadges,
  sortedBadges,
  correlationLabel,
  correlationDirection,
  moodBySleepThreshold,
  moodBySleepBucketCounts,
  sleepThreshold,
  isPro,
  motivationMessage,
  hasEnoughEntries,
  personalSleepThreshold,
  moodByPersonalThreshold,
  onOpenPaywall,
  t,
}: SummaryProps) => {
  return (
    <motion.div
      className="insights-panel"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={panelTransition}
    >
      {!entriesLoading && entries.length === 1 && (
        <InsightsFirstTwoCard entries={entries} goToLog={goToLog} />
      )}
      {!entriesLoading && entries.length >= 2 && entries.length <= 4 && (
        <InsightsFirstFiveCard entries={entries} goToLog={goToLog} />
      )}
      {!entriesLoading && entries.length === 0 && (
        <InsightsSummaryIntro
          entryCount={entries.length}
          entriesLoading={entriesLoading}
          goToLog={goToLog}
        />
      )}
      <InsightsStats
        isLoading={isLoading}
        averages={averages}
        windowAverages={windowAverages}
        statCounts={statCounts}
        rhythmScore={rhythmScore}
        streak={streak}
        sleepConsistencyLabel={sleepConsistencyLabel}
        correlationLabel={correlationLabel}
        correlationDirection={correlationDirection}
        moodBySleepThreshold={moodBySleepThreshold}
        moodBySleepBucketCounts={moodBySleepBucketCounts}
        sleepThreshold={sleepThreshold}
        isPro={isPro}
        goToLog={goToLog}
        motivationMessage={motivationMessage}
      />
      {hasEnoughEntries && (
        <IdeaSleepTarget
          isPro={isPro}
          entryCount={entries.length}
          personalSleepThreshold={personalSleepThreshold}
          averageSleep={averages.sleep}
          moodByPersonalThreshold={moodByPersonalThreshold}
          onOpenPaywall={onOpenPaywall}
          goToLog={goToLog}
        />
      )}
      {sleepConsistencyBadges.length > 0 && (
        <section className="card">
          <div className="card-header">
            <div>
              <h2>{t('insights.badges')}</h2>
              <p className="muted">{t('insights.levelUp')}</p>
            </div>
          </div>
          <div className="badge-list">
            {sortedBadges.map((badge) => {
              const isMaxTier = badge.unlocked && (badge.tierCount === 1 || badge.currentTierIndex === badge.tierCount - 1)
              const step = badge.unlocked ? (isMaxTier ? 'last' : badge.currentTierIndex + 2) : 1
              const badgeSrc = step === 'last'
                ? rankingBadgeLast
                : [rankingBadge1, rankingBadge2, rankingBadge3, rankingBadge4, rankingBadge5][step - 1]
              return (
                <div
                  className={`badge-row ${badge.unlocked ? 'unlocked' : 'locked'}`}
                  key={badge.id}
                >
                  <div className="badge-row-header">
                    <div className="badge-title-row">
                      <p className="badge-title">{badge.title}</p>
                      <img
                        className="badge-status-icon badge-status-icon--ranking"
                        src={badgeSrc}
                        alt=""
                        aria-hidden
                      />
                    </div>
                    <p className="badge-helper">{badge.description}</p>
                  </div>
                  {badge.progressTotal > 0 && !isMaxTier && (
                    <div className="badge-progress-track" aria-hidden="true">
                      <span
                        className="badge-progress-fill"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, (badge.progressValue / (badge.progressTotal || 1)) * 100),
                          )}%`,
                        }}
                      />
                    </div>
                  )}
                  {badge.progressText
                    ? (
                        <p className="badge-progress-text">{badge.progressText}</p>
                      )
                    : null}
                </div>
              )
            })}
          </div>
        </section>
      )}
    </motion.div>
  )
}
