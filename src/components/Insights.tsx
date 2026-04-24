import { useEffect, useMemo, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { Entry } from '../lib/entries'
import type { StatCounts } from '../lib/stats'
import type {
  RollingPoint,
  RollingSummary,
  SleepMoodAverages,
  Badge,
  TagDriver,
  TagSleepDriver,
  TrendPoint,
  WeekdayAveragePoint,
  WindowStats,
} from '../lib/types/stats'
import { Charts, type ScatterRange } from './insights/Charts'
import { Events } from './insights/Events'
import { Summary } from './insights/Summary'
import { Timeline } from './insights/Timeline'
import {
  type FilterOperator,
  type TimelineFilterState,
} from './insights/TimelineFilters'
import { useIsMobile } from '../hooks/useIsMobile'
import { buildMockScatterPlottedData } from '../lib/insightsMock'
import { getMotivationMessage } from '../lib/utils/motivationMessage'
import { visibleBadgesForInsightsEntryCount } from '../lib/utils/tieredBadges'
import { motionTransition } from '../lib/motion'
import { MAX_TAG_LENGTH } from '../lib/utils/stringUtils'

type InsightsTab = 'summary' | 'charts' | 'events' | 'timeline'
const SCATTER_RANGE_DAYS: Record<Exclude<ScatterRange, 'all'>, number> = {
  last30: 30,
  last90: 90,
}
const DEFAULT_TIMELINE_FILTERS: TimelineFilterState = {
  moodOperator: 'eq',
  moodValue: null,
  sleepOperator: 'eq',
  sleepValue: null,
  tags: [],
}
const TIMELINE_FILTERS_SESSION_KEY = 'insights.timeline.appliedFilters.v1'
const TIMELINE_MONTH_SESSION_KEY = 'insights.timeline.selectedMonth.v1'

const isFilterOperator = (value: unknown): value is FilterOperator => {
  return value === 'eq' || value === 'gte' || value === 'lte'
}

const parsePersistedTimelineFilters = (): TimelineFilterState => {
  if (typeof window === 'undefined') return DEFAULT_TIMELINE_FILTERS

  const raw = window.sessionStorage.getItem(TIMELINE_FILTERS_SESSION_KEY)
  if (!raw) return DEFAULT_TIMELINE_FILTERS

  try {
    const parsed = JSON.parse(raw) as Partial<TimelineFilterState>
    const moodOperator = isFilterOperator(parsed.moodOperator) ? parsed.moodOperator : DEFAULT_TIMELINE_FILTERS.moodOperator
    const sleepOperator = isFilterOperator(parsed.sleepOperator) ? parsed.sleepOperator : DEFAULT_TIMELINE_FILTERS.sleepOperator
    const moodValue = typeof parsed.moodValue === 'number' && Number.isFinite(parsed.moodValue) ? parsed.moodValue : null
    const sleepValue = typeof parsed.sleepValue === 'number' && Number.isFinite(parsed.sleepValue) ? parsed.sleepValue : null
    const tags = Array.isArray(parsed.tags)
      ? [...new Set(parsed.tags.filter((tag): tag is string => typeof tag === 'string').map(tag => tag.trim().toLowerCase()).filter(Boolean))]
      : []

    return {
      moodOperator,
      moodValue,
      sleepOperator,
      sleepValue,
      tags,
    }
  }
  catch {
    return DEFAULT_TIMELINE_FILTERS
  }
}

const getDefaultSelectedMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const parsePersistedSelectedMonth = (): string => {
  if (typeof window === 'undefined') return getDefaultSelectedMonth()
  const raw = window.sessionStorage.getItem(TIMELINE_MONTH_SESSION_KEY)
  if (!raw) return getDefaultSelectedMonth()
  if (raw === 'all' || /^\d{4}-\d{2}$/.test(raw)) return raw
  return getDefaultSelectedMonth()
}

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
  statCounts: StatCounts
  rhythmScore: number | null
  streak: number
  sleepConsistencyLabel: string | null
  sleepConsistencyBadges: Badge[]
  correlationLabel: string | null
  correlationDirection: string | null
  moodBySleepThreshold: { high: number | null, low: number | null }
  sleepThreshold: number
  moodColors: string[]
  trendSeries: { last7: TrendPoint[], last30: TrendPoint[], last90: TrendPoint[] }
  rollingSeries: RollingPoint[]
  rollingSummaries: RollingSummary[]
  weekdayAverages: WeekdayAveragePoint[]
  personalSleepThreshold: number | null
  moodByPersonalThreshold: { high: number | null, low: number | null }
  tagDrivers: TagDriver[]
  tagSleepDrivers: TagSleepDriver[]
  tagColors: Record<string, string>
  isPro: boolean
  onOpenPaywall: () => void
  onOpenFeedback: () => void
  activeTab: InsightsTab
  goToLog: () => void
  onGoToTimeline: () => void
  onRenameTag: (fromTag: string, toTag: string) => void
  onTagColorChange: (tag: string, color: string) => void
}

export const Insights = ({
  entries,
  entriesLoading,
  chartData,
  averages,
  windowAverages,
  statCounts,
  rhythmScore,
  streak,
  sleepConsistencyLabel,
  sleepConsistencyBadges,
  correlationLabel,
  correlationDirection,
  moodBySleepThreshold,
  sleepThreshold,
  moodColors,
  trendSeries,
  rollingSeries,
  rollingSummaries,
  weekdayAverages,
  personalSleepThreshold,
  moodByPersonalThreshold,
  tagDrivers,
  tagSleepDrivers,
  tagColors,
  isPro,
  onOpenPaywall,
  activeTab,
  goToLog,
  onGoToTimeline,
  onRenameTag,
  onTagColorChange,
}: InsightsProps) => {
  const { t, i18n } = useTranslation()
  const isLoading = entriesLoading
  const isEmpty = !entriesLoading && entries.length === 0
  const hasEnoughEntries = entries.length >= 3
  const [scatterRange, setScatterRange] = useState<ScatterRange>('last30')
  const showScatter90 = entries.length >= 30
  const showScatterAll = entries.length >= 90
  const jitterFromId = (id: string, scale = 0.18) => {
    let hash = 0
    for (let i = 0; i < id.length; i += 1) {
      hash = (hash << 5) - hash + id.charCodeAt(i)
      hash |= 0
    }
    const normalized = (hash % 1000) / 1000
    return (normalized - 0.5) * scale
  }

  const effectiveScatterRange = useMemo((): ScatterRange => {
    if (scatterRange === 'all' && !showScatterAll) return showScatter90 ? 'last90' : 'last30'
    if (scatterRange === 'last90' && !showScatter90) return 'last30'
    return scatterRange
  }, [scatterRange, showScatter90, showScatterAll])

  const hasMissingStats = rhythmScore === null
    || sleepConsistencyLabel === null
    || correlationLabel === null
    || (moodBySleepThreshold.high === null && moodBySleepThreshold.low === null)
  const moodBySleepDeltaPercent = useMemo(() => {
    const high = moodBySleepThreshold.high
    const low = moodBySleepThreshold.low
    if (high === null || low === null) return null
    if (low > 0) return ((high - low) / low) * 100
    return 0
  }, [moodBySleepThreshold.high, moodBySleepThreshold.low])

  const motivationMessage = useMemo(
    () =>
      getMotivationMessage({
        entries,
        statCounts,
        streak,
        windowAverages: { last7: windowAverages.last7, last30: windowAverages.last30 },
        rollingSummaries,
        rhythmScore,
        moodBySleepDeltaPercent,
        hasMissingStats,
        weekdayAverages,
        correlationLabel,
      }),
    [
      entries,
      statCounts,
      streak,
      windowAverages.last7,
      windowAverages.last30,
      rollingSummaries,
      rhythmScore,
      moodBySleepDeltaPercent,
      hasMissingStats,
      weekdayAverages,
      correlationLabel,
    ],
  )

  const insightsVisibleBadges = useMemo(
    () => visibleBadgesForInsightsEntryCount(sleepConsistencyBadges, entries.length),
    [sleepConsistencyBadges, entries.length],
  )

  const sortedBadges = useMemo(() => {
    const isCompleted = (b: Badge) =>
      b.unlocked && (b.tierCount === 1 || b.currentTierIndex === b.tierCount - 1)
    const progressRatio = (b: Badge) =>
      b.progressTotal > 0 ? b.progressValue / b.progressTotal : 0
    return [...insightsVisibleBadges].sort((a, b) => {
      const aDone = isCompleted(a)
      const bDone = isCompleted(b)
      if (aDone !== bDone) return aDone ? -1 : 1
      return progressRatio(b) - progressRatio(a)
    })
  }, [insightsVisibleBadges])

  const scatterEntries = useMemo(() => {
    if (!isPro) return []
    if (effectiveScatterRange === 'all') return chartData
    const n = SCATTER_RANGE_DAYS[effectiveScatterRange]
    return chartData.slice(-n)
  }, [chartData, effectiveScatterRange, isPro])

  const plottedData = useMemo(() => {
    return scatterEntries.flatMap((entry) => {
      const sleep = Number(entry.sleep_hours)
      const mood = Number(entry.mood)
      if (!Number.isFinite(sleep) || !Number.isFinite(mood)) {
        return []
      }
      const sleepClamped = Math.min(10, Math.max(4, sleep))
      const moodClamped = Math.min(5, Math.max(1, mood))
      const jitter = jitterFromId(entry.id)
      return [{
        ...entry,
        sleep_hours_clamped: sleepClamped,
        sleep_hours_jittered: Math.min(10, Math.max(4, sleepClamped + jitter)),
        mood_jittered: Math.min(5, Math.max(1, moodClamped + jitter / 2)),
      }]
    })
  }, [scatterEntries])

  /** Highlight band on scatter: ideal sleep target ±30 min, clamped to chart domain [4, 10]. */
  const idealSleepRangeBand = useMemo(() => {
    if (personalSleepThreshold == null || !Number.isFinite(personalSleepThreshold)) {
      return null
    }
    const halfHour = 0.5
    const x1 = Math.max(4, personalSleepThreshold - halfHour)
    const x2 = Math.min(10, personalSleepThreshold + halfHour)
    if (x1 >= x2) return null
    return { x1, x2 }
  }, [personalSleepThreshold])

  const scatterPlottedData = useMemo(() => {
    if (isPro) return plottedData
    return buildMockScatterPlottedData()
  }, [isPro, plottedData])

  const topTags = useMemo(() => {
    const countByKey = new Map<string, { count: number, display: string }>()
    entries.forEach((entry) => {
      const tags = entry.tags ?? []
      tags.forEach((tag) => {
        const t = tag.trim()
        if (!t) return
        const key = t.toLowerCase()
        const existing = countByKey.get(key)
        if (existing) {
          existing.count += 1
        }
        else {
          countByKey.set(key, { count: 1, display: t })
        }
      })
    })
    return Array.from(countByKey.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([, { display, count }]) => ({ display, count }))
  }, [entries])
  const timelineEntries = useMemo(() => {
    return [...entries].sort((a, b) => b.entry_date.localeCompare(a.entry_date))
  }, [entries])
  const timelineTagOptions = useMemo(() => {
    return topTags.map(({ display }) => ({
      key: display.trim().toLowerCase(),
      label: display,
    }))
  }, [topTags])
  const timelineTagLabelByKey = useMemo(() => {
    return new Map(timelineTagOptions.map(tag => [tag.key, tag.label]))
  }, [timelineTagOptions])
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)
  const [prevActiveTab, setPrevActiveTab] = useState(activeTab)
  if (activeTab !== prevActiveTab) {
    setPrevActiveTab(activeTab)
    if (prevActiveTab === 'timeline' && activeTab !== 'timeline') {
      setIsFilterSheetOpen(false)
      setIsMonthPickerOpen(false)
    }
  }
  const [selectedMonth, setSelectedMonth] = useState(parsePersistedSelectedMonth)
  const [appliedTimelineFilters, setAppliedTimelineFilters] = useState<TimelineFilterState>(parsePersistedTimelineFilters)
  const [draftTimelineFilters, setDraftTimelineFilters] = useState<TimelineFilterState>(appliedTimelineFilters)
  const [timelineTagSearch, setTimelineTagSearch] = useState('')

  const monthOptions = useMemo(() => {
    const locale = i18n.resolvedLanguage || i18n.language || undefined
    const now = new Date()
    const monthFormatter = new Intl.DateTimeFormat(locale, { month: 'long' })
    const yearFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric' })
    const capitalizeMonthLabel = (monthLabel: string) => {
      if (!monthLabel) return monthLabel
      return monthLabel.charAt(0).toLocaleUpperCase(locale) + monthLabel.slice(1)
    }
    const monthlyOptions = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const formattedMonth = capitalizeMonthLabel(monthFormatter.format(date))
      return {
        key,
        label: `${formattedMonth} ${yearFormatter.format(date)}`,
      }
    })
    return [
      { key: 'all', label: t('insights.timelineFilters.allEntries') },
      ...monthlyOptions,
    ]
  }, [i18n.language, i18n.resolvedLanguage, t])
  const selectedMonthLabel = useMemo(() => {
    return monthOptions.find(option => option.key === selectedMonth)?.label ?? selectedMonth
  }, [monthOptions, selectedMonth])
  const matchesOperator = (value: number, target: number, operator: FilterOperator) => {
    if (operator === 'gte') return value >= target
    if (operator === 'lte') return value <= target
    return value === target
  }
  const filteredTimelineEntries = useMemo(() => {
    const normalizedTagSet = new Set(appliedTimelineFilters.tags)
    return timelineEntries.filter((entry) => {
      if (selectedMonth !== 'all' && !entry.entry_date.startsWith(selectedMonth)) return false
      if (appliedTimelineFilters.moodValue !== null) {
        if (entry.mood == null) return false
        if (!matchesOperator(entry.mood, appliedTimelineFilters.moodValue, appliedTimelineFilters.moodOperator)) {
          return false
        }
      }
      if (appliedTimelineFilters.sleepValue !== null) {
        if (entry.sleep_hours == null) return false
        if (!matchesOperator(entry.sleep_hours, appliedTimelineFilters.sleepValue, appliedTimelineFilters.sleepOperator)) {
          return false
        }
      }
      if (normalizedTagSet.size > 0) {
        const entryTags = (entry.tags ?? []).map(tag => tag.trim().toLowerCase())
        if (!Array.from(normalizedTagSet).every(tag => entryTags.includes(tag))) {
          return false
        }
      }
      return true
    })
  }, [appliedTimelineFilters, selectedMonth, timelineEntries])
  const appliedFilterCount = useMemo(() => {
    let total = 0
    if (appliedTimelineFilters.moodValue !== null) total += 1
    if (appliedTimelineFilters.sleepValue !== null) total += 1
    if (appliedTimelineFilters.tags.length > 0) total += 1
    return total
  }, [appliedTimelineFilters])
  const operatorOptions = useMemo((): { value: FilterOperator, label: string }[] => ([
    { value: 'eq', label: t('insights.timelineFilters.exactly') },
    { value: 'gte', label: t('insights.timelineFilters.atLeast') },
    { value: 'lte', label: t('insights.timelineFilters.atMost') },
  ]), [t])
  const operatorLabelByValue = useMemo(() => {
    return new Map(operatorOptions.map(option => [option.value, option.label]))
  }, [operatorOptions])
  const visibleTimelineTagOptions = useMemo(() => {
    const query = timelineTagSearch.trim().toLowerCase()
    const selectedSet = new Set(draftTimelineFilters.tags)
    const selectedFirst = draftTimelineFilters.tags
      .map((key) => {
        return timelineTagOptions.find(tag => tag.key === key)
      })
      .filter((tag): tag is { key: string, label: string } => Boolean(tag))

    const matchedUnselected = timelineTagOptions.filter((tag) => {
      if (selectedSet.has(tag.key)) return false
      if (!query) return true
      return tag.label.toLowerCase().includes(query)
    })

    return [...selectedFirst, ...matchedUnselected]
  }, [draftTimelineFilters.tags, timelineTagOptions, timelineTagSearch])

  const formatTimelineDate = (value: string) => {
    const parsed = new Date(`${value}T00:00:00`)
    if (Number.isNaN(parsed.getTime())) {
      return { dateLabel: value, weekdayLabel: t('common.noDataDash') }
    }
    const locale = i18n.resolvedLanguage || i18n.language || undefined
    const monthDayLabel = parsed.toLocaleDateString(locale, { month: 'long', day: 'numeric' })
    const yearLabel = parsed.toLocaleDateString(locale, { year: 'numeric' })
    const currentYear = new Date().getFullYear()
    const isCurrentYear = parsed.getFullYear() === currentYear
    return {
      dateLabel: isCurrentYear ? monthDayLabel : `${monthDayLabel} • ${yearLabel}`,
      weekdayLabel: parsed.toLocaleDateString(locale, { weekday: 'long' }),
    }
  }
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [showAllTags, setShowAllTags] = useState(false)
  const visibleTags = showAllTags ? topTags : topTags.slice(0, 4)
  const [colorPickerTag, setColorPickerTag] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const closeTransientPanels = () => {
      setIsFilterSheetOpen(false)
      setIsMonthPickerOpen(false)
      setColorPickerTag(null)
    }
    window.addEventListener('app:close-transient-panels', closeTransientPanels)
    return () => {
      window.removeEventListener('app:close-transient-panels', closeTransientPanels)
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const className = 'timeline-filter-sheet-open'
    const sheetOpenOnTimeline = isFilterSheetOpen && activeTab === 'timeline'
    if (sheetOpenOnTimeline) {
      document.body.classList.add(className)
    }
    else {
      document.body.classList.remove(className)
    }
    return () => {
      document.body.classList.remove(className)
    }
  }, [isFilterSheetOpen, activeTab])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem(TIMELINE_FILTERS_SESSION_KEY, JSON.stringify(appliedTimelineFilters))
  }, [appliedTimelineFilters])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem(TIMELINE_MONTH_SESSION_KEY, selectedMonth)
  }, [selectedMonth])

  useEffect(() => {
    if (!isMonthPickerOpen || typeof document === 'undefined') return
    const handlePointerOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('.timeline-month-picker')) return
      if (target.closest('.timeline-month-pill')) return
      setIsMonthPickerOpen(false)
    }
    document.addEventListener('mousedown', handlePointerOutside)
    document.addEventListener('touchstart', handlePointerOutside)
    return () => {
      document.removeEventListener('mousedown', handlePointerOutside)
      document.removeEventListener('touchstart', handlePointerOutside)
    }
  }, [isMonthPickerOpen])

  const startEditingTag = (tag: string) => {
    setEditingTag(tag)
    setEditingValue(tag.slice(0, MAX_TAG_LENGTH))
  }

  const commitEditingTag = () => {
    if (!editingTag) return
    const trimmed = editingValue.trim()
    const limited = trimmed.slice(0, MAX_TAG_LENGTH).toLowerCase()
    if (!limited || limited === editingTag.toLowerCase()) {
      setEditingTag(null)
      setEditingValue('')
      return
    }
    onRenameTag(editingTag, limited)
    setEditingTag(null)
    setEditingValue('')
  }

  const cancelEditingTag = () => {
    setEditingTag(null)
    setEditingValue('')
  }

  const isMobile = useIsMobile()
  const reduceMotion = useReducedMotion()
  const panelTransition = reduceMotion ? { duration: 0 } : motionTransition

  return (
    <>
      {activeTab === 'summary'
        ? (
            <Summary
              reduceMotion={reduceMotion}
              panelTransition={panelTransition}
              entriesLoading={entriesLoading}
              entries={entries}
              goToLog={goToLog}
              isLoading={isLoading}
              averages={averages}
              windowAverages={windowAverages}
              statCounts={statCounts}
              rhythmScore={rhythmScore}
              streak={streak}
              sleepConsistencyLabel={sleepConsistencyLabel}
              sleepConsistencyBadges={insightsVisibleBadges}
              sortedBadges={sortedBadges}
              correlationLabel={correlationLabel}
              correlationDirection={correlationDirection}
              moodBySleepThreshold={moodBySleepThreshold}
              sleepThreshold={sleepThreshold}
              isPro={isPro}
              motivationMessage={motivationMessage.text}
              hasEnoughEntries={hasEnoughEntries}
              personalSleepThreshold={personalSleepThreshold}
              moodByPersonalThreshold={moodByPersonalThreshold}
              onOpenPaywall={onOpenPaywall}
              t={t}
            />
          )
        : null}
      {activeTab === 'charts'
        ? (
            <Charts
              reduceMotion={reduceMotion}
              panelTransition={panelTransition}
              entries={entries}
              moodColors={moodColors}
              goToLog={goToLog}
              isMobile={isMobile}
              weekdayAverages={weekdayAverages}
              hasEnoughEntries={hasEnoughEntries}
              isLoading={isLoading}
              isPro={isPro}
              isEmpty={isEmpty}
              plottedData={plottedData}
              scatterPlottedData={scatterPlottedData}
              tagColors={tagColors}
              effectiveScatterRange={effectiveScatterRange}
              onScatterRangeChange={setScatterRange}
              showScatter90={showScatter90}
              showScatterAll={showScatterAll}
              idealSleepRangeBand={idealSleepRangeBand}
              rollingSeries={rollingSeries}
              rollingSummaries={rollingSummaries}
              trendSeries={trendSeries}
              onOpenPaywall={onOpenPaywall}
            />
          )
        : null}
      {activeTab === 'events'
        ? (
            <Events
              reduceMotion={reduceMotion}
              panelTransition={panelTransition}
              topTags={topTags}
              visibleTags={visibleTags}
              editingTag={editingTag}
              editingValue={editingValue}
              onEditingValueChange={setEditingValue}
              onCommitEditingTag={commitEditingTag}
              onCancelEditingTag={cancelEditingTag}
              onStartEditingTag={startEditingTag}
              tagColors={tagColors}
              onSetColorPickerTag={setColorPickerTag}
              colorPickerTag={colorPickerTag}
              onTagColorChange={onTagColorChange}
              showAllTags={showAllTags}
              onToggleShowAllTags={() => {
                setShowAllTags((prev) => {
                  const next = !prev
                  if (prev && typeof window !== 'undefined') {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                  return next
                })
              }}
              goToLog={goToLog}
              onOpenTagInTimeline={(tag) => {
                const normalizedTag = tag.trim().toLowerCase()
                if (!normalizedTag) return
                const nextFilters: TimelineFilterState = {
                  ...DEFAULT_TIMELINE_FILTERS,
                  tags: [normalizedTag],
                }
                setSelectedMonth('all')
                setAppliedTimelineFilters(nextFilters)
                setDraftTimelineFilters(nextFilters)
                setTimelineTagSearch('')
                setIsFilterSheetOpen(false)
                setIsMonthPickerOpen(false)
                onGoToTimeline()
              }}
              hasEnoughEntries={hasEnoughEntries}
              isPro={isPro}
              tagDrivers={tagDrivers}
              tagSleepDrivers={tagSleepDrivers}
              onOpenPaywall={onOpenPaywall}
              t={t}
            />
          )
        : null}
      {activeTab === 'timeline'
        ? (
            <Timeline
              reduceMotion={reduceMotion}
              panelTransition={panelTransition}
              t={t}
              selectedMonthLabel={selectedMonthLabel}
              displayedEntriesCount={filteredTimelineEntries.length}
              onToggleMonthPicker={() => setIsMonthPickerOpen(prev => !prev)}
              isMonthPickerOpen={isMonthPickerOpen}
              monthOptions={monthOptions}
              selectedMonth={selectedMonth}
              appliedTimelineFilters={appliedTimelineFilters}
              operatorLabelByValue={operatorLabelByValue}
              timelineTagLabelByKey={timelineTagLabelByKey}
              isFilterSheetOpen={isFilterSheetOpen}
              appliedFilterCount={appliedFilterCount}
              operatorOptions={operatorOptions}
              moodColors={moodColors}
              draftTimelineFilters={draftTimelineFilters}
              timelineTagSearch={timelineTagSearch}
              visibleTimelineTagOptions={visibleTimelineTagOptions}
              tagColors={tagColors}
              onSelectMonth={(key) => {
                setSelectedMonth(key)
                setIsMonthPickerOpen(false)
              }}
              onClearAppliedMood={() => {
                setAppliedTimelineFilters(prev => ({ ...prev, moodValue: null }))
                setDraftTimelineFilters(prev => ({ ...prev, moodValue: null }))
              }}
              onClearAppliedSleep={() => {
                setAppliedTimelineFilters(prev => ({ ...prev, sleepValue: null }))
                setDraftTimelineFilters(prev => ({ ...prev, sleepValue: null }))
              }}
              onRemoveAppliedTag={(tag) => {
                setAppliedTimelineFilters(prev => ({
                  ...prev,
                  tags: prev.tags.filter(activeTag => activeTag !== tag),
                }))
                setDraftTimelineFilters(prev => ({
                  ...prev,
                  tags: prev.tags.filter(activeTag => activeTag !== tag),
                }))
              }}
              onOpenFilter={() => {
                setDraftTimelineFilters(appliedTimelineFilters)
                setTimelineTagSearch('')
                setIsFilterSheetOpen(true)
              }}
              onCloseFilter={() => setIsFilterSheetOpen(false)}
              onDraftMoodOperatorChange={operator => setDraftTimelineFilters(prev => ({ ...prev, moodOperator: operator }))}
              onDraftMoodValueChange={value => setDraftTimelineFilters(prev => ({ ...prev, moodValue: value }))}
              onDraftSleepOperatorChange={operator =>
                setDraftTimelineFilters(prev => ({
                  ...prev,
                  sleepOperator: operator,
                  sleepValue: prev.sleepValue ?? 0,
                }))}
              onDraftSleepValueChange={value => setDraftTimelineFilters(prev => ({ ...prev, sleepValue: value }))}
              onTimelineTagSearchChange={value => setTimelineTagSearch(value)}
              onToggleDraftTag={tagKey =>
                setDraftTimelineFilters(prev => ({
                  ...prev,
                  tags: prev.tags.includes(tagKey)
                    ? prev.tags.filter(activeTag => activeTag !== tagKey)
                    : [...prev.tags, tagKey],
                }))}
              onClearAllDraft={() => setDraftTimelineFilters(DEFAULT_TIMELINE_FILTERS)}
              onApplyDraftFilters={() => {
                setAppliedTimelineFilters(draftTimelineFilters)
                setIsFilterSheetOpen(false)
              }}
              entriesLoading={entriesLoading}
              filteredTimelineEntries={filteredTimelineEntries}
              formatTimelineDate={formatTimelineDate}
            />
          )
        : null}
    </>
  )
}
