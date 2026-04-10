import { type ComponentProps } from 'react'
import { motion, type Transition } from 'framer-motion'
import type { Entry } from '../../lib/entries'
import type { RollingPoint, RollingSummary, TrendPoint, WeekdayAveragePoint } from '../../lib/types/stats'
import { InsightsCalendarHeatmap } from './InsightsCalendarHeatmap'
import { InsightsDailyHistory } from './InsightsDailyHistory'
import { InsightsMoodDistribution } from './InsightsMoodDistribution'
import { InsightsScatter } from './InsightsScatter'
import { InsightsSmoothedTrends } from './InsightsSmoothedTrends'
import { InsightsWeekdayAverages } from './InsightsWeekdayAverages'

export type ScatterRange = 'all' | 'last30' | 'last90'

export type ChartsProps = {
  reduceMotion: boolean | null
  panelTransition: Transition
  entries: Entry[]
  moodColors: string[]
  goToLog: () => void
  isMobile: boolean
  weekdayAverages: WeekdayAveragePoint[]
  hasEnoughEntries: boolean
  isLoading: boolean
  isPro: boolean
  isEmpty: boolean
  plottedData: ComponentProps<typeof InsightsScatter>['plottedData']
  scatterPlottedData: ComponentProps<typeof InsightsScatter>['plottedData']
  tagColors: Record<string, string>
  effectiveScatterRange: ScatterRange
  onScatterRangeChange: (value: ScatterRange) => void
  showScatter90: boolean
  showScatterAll: boolean
  idealSleepRangeBand: { x1: number, x2: number } | null
  rollingSeries: RollingPoint[]
  rollingSummaries: RollingSummary[]
  trendSeries: { last30: TrendPoint[], last90: TrendPoint[], last365: TrendPoint[] }
  onOpenPaywall: () => void
}

export const Charts = ({
  reduceMotion,
  panelTransition,
  entries,
  moodColors,
  goToLog,
  isMobile,
  weekdayAverages,
  hasEnoughEntries,
  isLoading,
  isPro,
  isEmpty,
  plottedData,
  scatterPlottedData,
  tagColors,
  effectiveScatterRange,
  onScatterRangeChange,
  showScatter90,
  showScatterAll,
  idealSleepRangeBand,
  rollingSeries,
  rollingSummaries,
  trendSeries,
  onOpenPaywall,
}: ChartsProps) => {
  return (
    <motion.div
      className="insights-panel"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={panelTransition}
    >
      <InsightsMoodDistribution
        entries={entries}
        moodColors={moodColors}
        goToLog={goToLog}
      />
      <InsightsCalendarHeatmap
        entries={entries}
        moodColors={moodColors}
        isMobile={isMobile}
      />
      <InsightsWeekdayAverages
        weekdayAverages={weekdayAverages}
        isMobile={isMobile}
        goToLog={goToLog}
      />
      {hasEnoughEntries && (
        <InsightsScatter
          isLoading={isLoading}
          hasAnyEntries={isPro ? !isEmpty : true}
          isRangeEmpty={isPro ? !isLoading && plottedData.length === 0 : false}
          isMobile={isMobile}
          plottedData={scatterPlottedData}
          moodColors={moodColors}
          tagColors={tagColors}
          scatterRange={effectiveScatterRange}
          onScatterRangeChange={onScatterRangeChange}
          show90Range={isPro ? showScatter90 : true}
          showAllRange={isPro ? showScatterAll : true}
          idealSleepRangeBand={idealSleepRangeBand}
          goToLog={goToLog}
          isPro={isPro}
          onOpenPaywall={onOpenPaywall}
        />
      )}
      {hasEnoughEntries && (
        <InsightsSmoothedTrends
          isPro={isPro}
          isMobile={isMobile}
          entryCount={entries.length}
          rollingSeries={rollingSeries}
          rollingSummaries={rollingSummaries}
          onOpenPaywall={onOpenPaywall}
          goToLog={goToLog}
        />
      )}
      {hasEnoughEntries && (
        <InsightsDailyHistory
          isPro={isPro}
          isMobile={isMobile}
          entryCount={entries.length}
          trendSeries={trendSeries}
          onOpenPaywall={onOpenPaywall}
          goToLog={goToLog}
        />
      )}
    </motion.div>
  )
}
