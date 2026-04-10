import { Moon } from 'lucide-react'
import { motion, type Transition } from 'framer-motion'
import type { Entry } from '../../lib/entries'
import { getHighContrastTextColor } from '../../lib/utils/colorContrast'
import { formatSleepHours } from '../../lib/utils/sleepHours'
import {
  TimelineFilters,
  TimelineMonthAction,
  type FilterOperator,
  type TimelineFilterState,
} from './TimelineFilters'

export type TimelineProps = {
  reduceMotion: boolean | null
  panelTransition: Transition
  t: (key: string, options?: Record<string, unknown>) => string
  selectedMonthLabel: string
  onToggleMonthPicker: () => void
  isMonthPickerOpen: boolean
  monthOptions: { key: string, label: string }[]
  selectedMonth: string
  hasAppliedTimelineFilters: boolean
  appliedTimelineFilters: TimelineFilterState
  operatorLabelByValue: Map<FilterOperator, string>
  timelineTagLabelByKey: Map<string, string>
  isFilterSheetOpen: boolean
  appliedFilterCount: number
  operatorOptions: { value: FilterOperator, label: string }[]
  moodColors: string[]
  draftTimelineFilters: TimelineFilterState
  timelineTagSearch: string
  visibleTimelineTagOptions: { key: string, label: string }[]
  tagColors: Record<string, string>
  onSelectMonth: (key: string) => void
  onClearAppliedMood: () => void
  onClearAppliedSleep: () => void
  onRemoveAppliedTag: (tag: string) => void
  onOpenFilter: () => void
  onCloseFilter: () => void
  onDraftMoodOperatorChange: (operator: FilterOperator) => void
  onDraftMoodValueChange: (value: number | null) => void
  onDraftSleepOperatorChange: (operator: FilterOperator) => void
  onDraftSleepValueChange: (value: number | null) => void
  onTimelineTagSearchChange: (value: string) => void
  onToggleDraftTag: (tagKey: string) => void
  onClearAllDraft: () => void
  onApplyDraftFilters: () => void
  entriesLoading: boolean
  filteredTimelineEntries: Entry[]
  formatTimelineDate: (value: string) => { dateLabel: string, weekdayLabel: string }
}

export const Timeline = ({
  reduceMotion,
  panelTransition,
  t,
  selectedMonthLabel,
  onToggleMonthPicker,
  isMonthPickerOpen,
  monthOptions,
  selectedMonth,
  hasAppliedTimelineFilters,
  appliedTimelineFilters,
  operatorLabelByValue,
  timelineTagLabelByKey,
  isFilterSheetOpen,
  appliedFilterCount,
  operatorOptions,
  moodColors,
  draftTimelineFilters,
  timelineTagSearch,
  visibleTimelineTagOptions,
  tagColors,
  onSelectMonth,
  onClearAppliedMood,
  onClearAppliedSleep,
  onRemoveAppliedTag,
  onOpenFilter,
  onCloseFilter,
  onDraftMoodOperatorChange,
  onDraftMoodValueChange,
  onDraftSleepOperatorChange,
  onDraftSleepValueChange,
  onTimelineTagSearchChange,
  onToggleDraftTag,
  onClearAllDraft,
  onApplyDraftFilters,
  entriesLoading,
  filteredTimelineEntries,
  formatTimelineDate,
}: TimelineProps) => {
  return (
    <motion.div
      className="insights-panel"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={panelTransition}
    >
      <div className="card-header">
        <div>
          <h2>{t('nav.timeline')}</h2>
          <p className="muted">{t('insights.overviewDailyLogs')}</p>
        </div>
        <TimelineMonthAction
          selectedMonthLabel={selectedMonthLabel}
          onToggleMonthPicker={onToggleMonthPicker}
        />
      </div>
      <TimelineFilters
        isMonthPickerOpen={isMonthPickerOpen}
        monthOptions={monthOptions}
        selectedMonth={selectedMonth}
        hasAppliedTimelineFilters={hasAppliedTimelineFilters}
        appliedTimelineFilters={appliedTimelineFilters}
        operatorLabelByValue={operatorLabelByValue}
        timelineTagLabelByKey={timelineTagLabelByKey}
        isFilterSheetOpen={isFilterSheetOpen}
        appliedFilterCount={appliedFilterCount}
        reduceMotion={reduceMotion}
        panelTransition={panelTransition}
        operatorOptions={operatorOptions}
        moodColors={moodColors}
        draftTimelineFilters={draftTimelineFilters}
        timelineTagSearch={timelineTagSearch}
        visibleTimelineTagOptions={visibleTimelineTagOptions}
        tagColors={tagColors}
        onSelectMonth={onSelectMonth}
        onClearAppliedMood={onClearAppliedMood}
        onClearAppliedSleep={onClearAppliedSleep}
        onRemoveAppliedTag={onRemoveAppliedTag}
        onOpenFilter={onOpenFilter}
        onCloseFilter={onCloseFilter}
        onDraftMoodOperatorChange={onDraftMoodOperatorChange}
        onDraftMoodValueChange={onDraftMoodValueChange}
        onDraftSleepOperatorChange={onDraftSleepOperatorChange}
        onDraftSleepValueChange={onDraftSleepValueChange}
        onTimelineTagSearchChange={onTimelineTagSearchChange}
        onToggleDraftTag={onToggleDraftTag}
        onClearAllDraft={onClearAllDraft}
        onApplyDraftFilters={onApplyDraftFilters}
      />
      {entriesLoading && (
        <p className="muted timeline-empty-state">{t('common.loading')}</p>
      )}
      {!entriesLoading && filteredTimelineEntries.length === 0 && (
        <p className="muted timeline-empty-state">{t('insights.noEntryForDay')}</p>
      )}
      {!entriesLoading && filteredTimelineEntries.length > 0 && (
        <div className="timeline-cards">
          {filteredTimelineEntries.map((entry) => {
            const timelineDate = formatTimelineDate(entry.entry_date)
            const moodLabel = entry.mood == null
              ? t('common.noDataDash')
              : t(`log.moodName${entry.mood}`)
            const moodDotColor = entry.mood == null
              ? 'var(--muted)'
              : moodColors[Math.max(0, Math.min(moodColors.length - 1, entry.mood - 1))]
            const sleepLabel = entry.sleep_hours == null
              ? t('common.noDataDash')
              : formatSleepHours(entry.sleep_hours)

            return (
              <article className="card timeline-card" key={entry.id}>
                <div className="timeline-card-date-row">
                  <h3 className="timeline-card-date">{timelineDate.dateLabel}</h3>
                  <span className="timeline-card-weekday">{timelineDate.weekdayLabel}</span>
                </div>
                <div className="timeline-card-metrics">
                  <span className="timeline-card-metric">
                    <span className="timeline-card-mood-dot" style={{ backgroundColor: moodDotColor }} aria-hidden />
                    <span>{moodLabel}</span>
                  </span>
                  <span className="timeline-card-metric">
                    <Moon size={14} aria-hidden />
                    <span>{sleepLabel}</span>
                  </span>
                </div>
                {entry.tags && entry.tags.length > 0 && (
                  <div className="timeline-card-tags">
                    {entry.tags.map((tag) => {
                      const colorKey = tag.trim().toLowerCase()
                      const tagColor = tagColors[colorKey]
                      const textColor = getHighContrastTextColor(tagColor)

                      return (
                        <span
                          className="timeline-card-tag"
                          key={tag}
                          style={
                            tagColor
                              ? { backgroundColor: tagColor, color: textColor, borderColor: 'transparent' }
                              : undefined
                          }
                        >
                          #
                          {tag}
                        </span>
                      )
                    })}
                  </div>
                )}
                {entry.note?.trim() && (
                  <p className="timeline-card-note">
                    <strong>
                      {t('common.notes')}
                      :
                    </strong>
                    {' '}
                    {entry.note}
                  </p>
                )}
              </article>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
