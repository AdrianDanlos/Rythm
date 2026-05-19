import { motion, type Transition } from 'framer-motion'
import { useMemo } from 'react'
import type { TagDriver, TagSleepDriver } from '../../lib/types/stats'
import { getTagInsightsPreviewData } from '../../lib/sampleData/tagInsightsPreview'
import { InsightsTagInsights } from './InsightsTagInsights'

export type EventsProps = {
  reduceMotion: boolean | null
  panelTransition: Transition
  goToLog: () => void
  onOpenTagInTimeline: (tag: string) => void
  entryCount: number
  eventInsightsMinCount: number
  isPro: boolean
  tagDrivers: TagDriver[]
  tagSleepDrivers: TagSleepDriver[]
  onOpenPaywall: () => void
  onOpenEditEvents: () => void
  t: (key: string, options?: Record<string, unknown>) => string
}

export const Events = ({
  reduceMotion,
  panelTransition,
  goToLog,
  onOpenTagInTimeline,
  entryCount,
  eventInsightsMinCount,
  isPro,
  tagDrivers,
  tagSleepDrivers,
  onOpenPaywall,
  onOpenEditEvents,
  t,
}: EventsProps) => {
  const previewData = useMemo(() => getTagInsightsPreviewData(t), [t])
  // Preview only on cold start. Once the user has crossed the min-entries
  // threshold but has no event correlations yet, the real empty-state copy
  // ("add events to see mood/sleep impact") is more honest than fake tags.
  const usePreview = entryCount < eventInsightsMinCount
  const displayMoodDrivers = usePreview ? previewData.tagDrivers : tagDrivers
  const displaySleepDrivers = usePreview ? previewData.tagSleepDrivers : tagSleepDrivers
  const previewLabel = usePreview ? t('insights.weekdayPreviewBadge') : undefined

  return (
    <motion.div
      className="insights-panel"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={panelTransition}
    >
      <InsightsTagInsights
        isPro={isPro}
        tagDrivers={displayMoodDrivers}
        tagSleepDrivers={displaySleepDrivers}
        onOpenPaywall={onOpenPaywall}
        goToLog={goToLog}
        onOpenTagInTimeline={onOpenTagInTimeline}
        eventInsightsMinCount={eventInsightsMinCount}
        previewLabel={previewLabel}
      />
      <div className="events-page-footer">
        <button
          type="button"
          className="events-page-edit-cta"
          onClick={onOpenEditEvents}
        >
          {t('insights.editEvents')}
        </button>
      </div>
    </motion.div>
  )
}
