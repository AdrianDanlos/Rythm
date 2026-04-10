import { type ComponentType, type CSSProperties } from 'react'
import { AnimatePresence, motion, type Transition } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Angry, Filter, Frown, Laugh, Meh, Smile } from 'lucide-react'
import { formatSleepHours } from '../../lib/utils/sleepHours'
import { getHighContrastTextColor } from '../../lib/utils/colorContrast'
import { tagColorPalette } from '../../lib/colors'

export type FilterOperator = 'eq' | 'gte' | 'lte'

export type TimelineFilterState = {
  moodOperator: FilterOperator
  moodValue: number | null
  sleepOperator: FilterOperator
  sleepValue: number | null
  tags: string[]
}

export type TimelineMonthOption = {
  key: string
  label: string
}

export type TimelineTagOption = {
  key: string
  label: string
}

const TIMELINE_MOOD_ICONS: Record<
  1 | 2 | 3 | 4 | 5,
  ComponentType<{ 'className'?: string, 'size'?: number, 'aria-hidden'?: boolean }>
> = {
  1: Angry,
  2: Frown,
  3: Meh,
  4: Smile,
  5: Laugh,
}

export const TimelineMonthAction = ({
  selectedMonthLabel,
  onToggleMonthPicker,
}: {
  selectedMonthLabel: string
  onToggleMonthPicker: () => void
}) => (
  <div className="timeline-top-actions">
    <button
      type="button"
      className="timeline-month-pill"
      onClick={onToggleMonthPicker}
    >
      {selectedMonthLabel}
    </button>
  </div>
)

type TimelineFiltersProps = {
  isMonthPickerOpen: boolean
  monthOptions: TimelineMonthOption[]
  selectedMonth: string
  hasAppliedTimelineFilters: boolean
  appliedTimelineFilters: TimelineFilterState
  operatorLabelByValue: Map<FilterOperator, string>
  timelineTagLabelByKey: Map<string, string>
  isFilterSheetOpen: boolean
  appliedFilterCount: number
  reduceMotion: boolean | null
  panelTransition: Transition
  operatorOptions: { value: FilterOperator, label: string }[]
  moodColors: string[]
  draftTimelineFilters: TimelineFilterState
  timelineTagSearch: string
  visibleTimelineTagOptions: TimelineTagOption[]
  tagColors: Record<string, string>
  onSelectMonth: (key: string) => void
  onClearAppliedMood: () => void
  onClearAppliedSleep: () => void
  onRemoveAppliedTag: (tag: string) => void
  onOpenFilter: () => void
  onCloseFilter: () => void
  onDraftMoodOperatorChange: (operator: FilterOperator) => void
  onDraftMoodValueChange: (value: number) => void
  onDraftSleepOperatorChange: (operator: FilterOperator) => void
  onDraftSleepValueChange: (value: number) => void
  onTimelineTagSearchChange: (value: string) => void
  onToggleDraftTag: (tagKey: string) => void
  onClearAllDraft: () => void
  onApplyDraftFilters: () => void
}

export const TimelineFilters = ({
  isMonthPickerOpen,
  monthOptions,
  selectedMonth,
  hasAppliedTimelineFilters,
  appliedTimelineFilters,
  operatorLabelByValue,
  timelineTagLabelByKey,
  isFilterSheetOpen,
  appliedFilterCount,
  reduceMotion,
  panelTransition,
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
}: TimelineFiltersProps) => {
  const { t } = useTranslation()
  const moodFaceOptions = [1, 2, 3, 4, 5] as const
  const getFallbackTagColor = (key: string) => {
    let hash = 0
    for (let i = 0; i < key.length; i += 1) {
      hash = (hash << 5) - hash + key.charCodeAt(i)
      hash |= 0
    }
    const index = Math.abs(hash) % tagColorPalette.length
    return tagColorPalette[index]
  }

  return (
    <>
      {isMonthPickerOpen && (
        <div className="timeline-month-picker card">
          {monthOptions.map(option => (
            <button
              type="button"
              key={option.key}
              className={`timeline-month-option ${option.key === selectedMonth ? 'active' : ''}`}
              onClick={() => onSelectMonth(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
      {hasAppliedTimelineFilters && (
        <div className="timeline-active-filters">
          {appliedTimelineFilters.moodValue !== null && (
            <button
              type="button"
              className="timeline-active-filter-chip"
              onClick={onClearAppliedMood}
            >
              {t('insights.timelineFilters.mood')}
              {' '}
              {operatorLabelByValue.get(appliedTimelineFilters.moodOperator)}
              {' '}
              {t(`log.moodName${appliedTimelineFilters.moodValue}`)}
              {' '}×
            </button>
          )}
          {appliedTimelineFilters.sleepValue !== null && (
            <button
              type="button"
              className="timeline-active-filter-chip"
              onClick={onClearAppliedSleep}
            >
              {t('insights.timelineFilters.sleep')}
              {' '}
              {operatorLabelByValue.get(appliedTimelineFilters.sleepOperator)}
              {' '}
              {formatSleepHours(appliedTimelineFilters.sleepValue)}
              {' '}×
            </button>
          )}
          {appliedTimelineFilters.tags.map(tag => (
            <button
              type="button"
              key={tag}
              className="timeline-active-filter-chip"
              onClick={() => onRemoveAppliedTag(tag)}
            >
              #
              {timelineTagLabelByKey.get(tag) ?? tag}
              {' '}×
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className="timeline-filter-fab"
        aria-label={t('common.filter')}
        title={t('common.filter')}
        onClick={onOpenFilter}
      >
        <Filter size={18} aria-hidden />
        {appliedFilterCount > 0 && (
          <span className="timeline-filter-fab-badge">{appliedFilterCount}</span>
        )}
      </button>
      <AnimatePresence>
        {isFilterSheetOpen && (
          <>
            <motion.button
              type="button"
              className="timeline-filter-sheet-backdrop"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={panelTransition}
              onClick={onCloseFilter}
              aria-label={t('common.close')}
            />
            <motion.section
              className="timeline-filter-sheet"
              initial={reduceMotion ? false : { y: 500 }}
              animate={{ y: 0 }}
              exit={reduceMotion ? undefined : { y: 500 }}
              transition={panelTransition}
            >
              <h3>{t('insights.timelineFilters.title')}</h3>
              <div className="timeline-filter-section">
                <p className="timeline-filter-section-title">{t('insights.timelineFilters.mood')}</p>
                <div className="timeline-filter-operator-row">
                  {operatorOptions.map(option => (
                    <button
                      type="button"
                      key={option.value}
                      className={`ghost ${draftTimelineFilters.moodOperator === option.value ? 'active' : ''}`}
                      onClick={() => onDraftMoodOperatorChange(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="timeline-filter-mood-row">
                  {moodFaceOptions.map((value) => {
                    const Icon = TIMELINE_MOOD_ICONS[value]
                    const moodColor = moodColors[value - 1] ?? 'var(--text)'
                    return (
                      <button
                        key={value}
                        type="button"
                        className={`timeline-mood-face ${draftTimelineFilters.moodValue === value ? 'active' : ''}`}
                        style={{ '--mood-color': moodColor } as CSSProperties}
                        onClick={() => onDraftMoodValueChange(value)}
                        aria-label={t(`log.moodName${value}`)}
                      >
                        <Icon className="timeline-mood-face-icon" size={20} aria-hidden />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="timeline-filter-section">
                <p className="timeline-filter-section-title">{t('insights.timelineFilters.sleep')}</p>
                <div className="timeline-filter-operator-row">
                  {operatorOptions.map(option => (
                    <button
                      type="button"
                      key={option.value}
                      className={`ghost ${draftTimelineFilters.sleepOperator === option.value ? 'active' : ''}`}
                      onClick={() => onDraftSleepOperatorChange(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="timeline-sleep-slider-wrap">
                  <input
                    type="range"
                    min={0}
                    max={12}
                    step={0.5}
                    value={draftTimelineFilters.sleepValue ?? 8}
                    onChange={event => onDraftSleepValueChange(Number(event.target.value))}
                  />
                  <div className="timeline-sleep-slider-meta">
                    <span>0h</span>
                    <strong>{formatSleepHours(draftTimelineFilters.sleepValue ?? 8)}</strong>
                    <span>12h</span>
                  </div>
                </div>
              </div>

              <div className="timeline-filter-section">
                <p className="timeline-filter-section-title">{t('insights.dailyEvents')}</p>
                <div className="timeline-filter-tag-search">
                  <input
                    type="search"
                    className="tag-dropdown-trigger log-reflection-input"
                    value={timelineTagSearch}
                    onChange={event => onTimelineTagSearchChange(event.target.value)}
                    placeholder={t('insights.timelineFilters.searchEvents')}
                    aria-label={t('insights.timelineFilters.searchEvents')}
                  />
                </div>
                <div className="timeline-filter-tags-scroll">
                  <div className="timeline-filter-tags-wrap">
                    {visibleTimelineTagOptions.map((tag, index) => {
                      const isSelected = draftTimelineFilters.tags.includes(tag.key)
                      const effectiveTagColor = tagColors[tag.key] ?? getFallbackTagColor(tag.key)
                      const textColor = getHighContrastTextColor(effectiveTagColor)
                      return (
                        <button
                          key={tag.key}
                          type="button"
                          className={`timeline-filter-tag-option ${isSelected ? 'active tag-pill' : ''}`}
                          data-color-index={index % 8}
                          style={
                            isSelected
                              ? { backgroundColor: effectiveTagColor, color: textColor, borderColor: 'transparent' }
                              : undefined
                          }
                          onClick={() => onToggleDraftTag(tag.key)}
                        >
                          #
                          {tag.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="timeline-filter-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={onClearAllDraft}
                >
                  {t('insights.timelineFilters.clearAll')}
                </button>
                <button
                  type="button"
                  className="cta-button"
                  onClick={onApplyDraftFilters}
                >
                  {t('insights.timelineFilters.showResults')}
                </button>
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
