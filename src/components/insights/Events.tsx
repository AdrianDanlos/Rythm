import { motion, type Transition } from 'framer-motion'
import type { TagDriver, TagSleepDriver } from '../../lib/types/stats'
import { InsightsTagInsights } from './InsightsTagInsights'

export type EventsProps = {
  reduceMotion: boolean | null
  panelTransition: Transition
  goToLog: () => void
  onOpenTagInTimeline: (tag: string) => void
  hasEnoughEntries: boolean
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
  hasEnoughEntries,
  isPro,
  tagDrivers,
  tagSleepDrivers,
  onOpenPaywall,
  onOpenEditEvents,
  t,
}: EventsProps) => {
  return (
    <motion.div
      className="insights-panel"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={panelTransition}
    >
      {hasEnoughEntries && (
        <InsightsTagInsights
          isPro={isPro}
          tagDrivers={tagDrivers}
          tagSleepDrivers={tagSleepDrivers}
          onOpenPaywall={onOpenPaywall}
          goToLog={goToLog}
          onOpenTagInTimeline={onOpenTagInTimeline}
        />
      )}
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
