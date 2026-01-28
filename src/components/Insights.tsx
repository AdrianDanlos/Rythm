import { useEffect, useState } from 'react'
import type { Entry } from '../lib/entries'
import type {
  RollingPoint,
  RollingSummary,
  SleepMoodAverages,
  TagInsight,
  TrendPoint,
  WindowStats,
} from '../lib/types/stats'
import { InsightsDailyHistory } from './insights/InsightsDailyHistory'
import { InsightsExport } from './insights/InsightsExport'
import { InsightsPersonalThreshold } from './insights/InsightsPersonalThreshold'
import { InsightsScatter } from './insights/InsightsScatter'
import { InsightsSmoothedTrends } from './insights/InsightsSmoothedTrends'
import { InsightsStats } from './insights/InsightsStats'
import { InsightsTagInsights } from './insights/InsightsTagInsights'

type InsightsProps = {
  entries: Entry[]
  entriesLoading: boolean
  chartData: Entry[]
  averages: SleepMoodAverages
  windowAverages: {
    last7: WindowStats
    last30: WindowStats
    last90: WindowStats
    last365: WindowStats
  }
  streak: number
  sleepConsistencyLabel: string | null
  correlationLabel: string | null
  correlationDirection: string | null
  moodBySleepThreshold: { high: number | null, low: number | null }
  sleepThreshold: number
  moodColors: string[]
  trendSeries: { last30: TrendPoint[], last90: TrendPoint[], last365: TrendPoint[] }
  rollingSeries: RollingPoint[]
  rollingSummaries: RollingSummary[]
  personalSleepThreshold: number | null
  moodByPersonalThreshold: { high: number | null, low: number | null }
  tagInsights: TagInsight[]
  isPro: boolean
  onExportCsv: () => void
  onExportMonthlyReport: () => void
  onOpenPaywall: () => void
}

export const Insights = ({
  entries,
  entriesLoading,
  chartData,
  averages,
  windowAverages,
  streak,
  sleepConsistencyLabel,
  correlationLabel,
  correlationDirection,
  moodBySleepThreshold,
  sleepThreshold,
  moodColors,
  trendSeries,
  rollingSeries,
  rollingSummaries,
  personalSleepThreshold,
  moodByPersonalThreshold,
  tagInsights,
  isPro,
  onExportCsv,
  onExportMonthlyReport,
  onOpenPaywall,
}: InsightsProps) => {
  const isLoading = entriesLoading
  const isEmpty = !entriesLoading && entries.length === 0
  const exportReportDisabled = isPro ? !entries.length : false
  const jitterFromId = (id: string, scale = 0.18) => {
    let hash = 0
    for (let i = 0; i < id.length; i += 1) {
      hash = (hash << 5) - hash + id.charCodeAt(i)
      hash |= 0
    }
    const normalized = (hash % 1000) / 1000
    return (normalized - 0.5) * scale
  }

  const plottedData = chartData.map((entry) => {
    const sleep = Number(entry.sleep_hours)
    const mood = Number(entry.mood)
    const sleepClamped = Math.min(10, Math.max(4, sleep))
    const moodClamped = Math.min(5, Math.max(1, mood))
    const jitter = jitterFromId(entry.id)
    return {
      ...entry,
      sleep_hours_clamped: sleepClamped,
      sleep_hours_jittered: Math.min(10, Math.max(4, sleepClamped + jitter)),
      mood_jittered: Math.min(5, Math.max(1, moodClamped + jitter / 2)),
    }
  })
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const media = window.matchMedia('(max-width: 540px)')
    const handleChange = () => setIsMobile(media.matches)
    handleChange()

    if (media.addEventListener) {
      media.addEventListener('change', handleChange)
      return () => media.removeEventListener('change', handleChange)
    }

    media.addListener(handleChange)
    return () => media.removeListener(handleChange)
  }, [])
  return (
    <>
      <InsightsStats
        isLoading={isLoading}
        averages={averages}
        windowAverages={windowAverages}
        streak={streak}
        sleepConsistencyLabel={sleepConsistencyLabel}
        correlationLabel={correlationLabel}
        correlationDirection={correlationDirection}
        moodBySleepThreshold={moodBySleepThreshold}
        sleepThreshold={sleepThreshold}
      />
      <InsightsSmoothedTrends
        isPro={isPro}
        isMobile={isMobile}
        rollingSeries={rollingSeries}
        rollingSummaries={rollingSummaries}
        onOpenPaywall={onOpenPaywall}
      />
      <InsightsDailyHistory
        isPro={isPro}
        isMobile={isMobile}
        trendSeries={trendSeries}
        onOpenPaywall={onOpenPaywall}
      />
      <InsightsPersonalThreshold
        isPro={isPro}
        personalSleepThreshold={personalSleepThreshold}
        moodByPersonalThreshold={moodByPersonalThreshold}
        onOpenPaywall={onOpenPaywall}
      />
      <InsightsTagInsights
        isPro={isPro}
        tagInsights={tagInsights}
        onOpenPaywall={onOpenPaywall}
      />
      <InsightsScatter
        isLoading={isLoading}
        isEmpty={isEmpty}
        entries={entries}
        plottedData={plottedData}
        moodColors={moodColors}
      />
      <InsightsExport
        entriesLength={entries.length}
        isPro={isPro}
        exportReportDisabled={exportReportDisabled}
        onExportCsv={onExportCsv}
        onExportMonthlyReport={onExportMonthlyReport}
        onOpenPaywall={onOpenPaywall}
      />
    </>
  )
}
