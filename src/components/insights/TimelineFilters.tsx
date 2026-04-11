import { type ComponentType, type CSSProperties, useState } from 'react'
import { AnimatePresence, motion, type Transition } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Angry, ChevronDown, Filter, Frown, Laugh, Meh, Moon, Smile } from 'lucide-react'
import { formatSleepHours } from '../../lib/utils/sleepHours'
import { getHighContrastTextColor } from '../../lib/utils/colorContrast'
import { getFallbackTagColor } from '../../lib/colors'

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
  selectedMonthLabel: string
  onToggleMonthPicker: () => void
  isMonthPickerOpen: boolean
  monthOptions: TimelineMonthOption[]
  selectedMonth: string
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
  selectedMonthLabel,
  onToggleMonthPicker,
  isMonthPickerOpen,
  monthOptions,
  selectedMonth,
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
  const sleepSliderValue = draftTimelineFilters.sleepValue ?? 0
  const [isMoodSectionOverride, setIsMoodSectionOverride] = useState<boolean | null>(null)
  const [isSleepSectionOverride, setIsSleepSectionOverride] = useState<boolean | null>(null)
  const [isEventsSectionOverride, setIsEventsSectionOverride] = useState<boolean | null>(null)
  const [isMoodOperatorTouched, setIsMoodOperatorTouched] = useState(false)
  const isMoodSectionOpen = isMoodSectionOverride ?? draftTimelineFilters.moodValue !== null
  const isSleepSectionOpen = isSleepSectionOverride ?? draftTimelineFilters.sleepValue !== null
  const isEventsSectionOpen = isEventsSectionOverride ?? draftTimelineFilters.tags.length > 0
  const sectionTransition = reduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' as const }
  const handleOpenFilter = () => {
    setIsMoodSectionOverride(null)
    setIsSleepSectionOverride(null)
    setIsEventsSectionOverride(null)
    setIsMoodOperatorTouched(false)
    onOpenFilter()
  }

  return (
    <>
      <div className="timeline-active-filters">
        <button
          type="button"
          className="timeline-month-pill"
          onClick={onToggleMonthPicker}
        >
          {selectedMonthLabel}
        </button>
        {appliedTimelineFilters.moodValue !== null && (
          <button
            type="button"
            className="timeline-active-filter-chip timeline-month-pill"
            onClick={onClearAppliedMood}
          >
            {t('insights.timelineFilters.mood')}
            {appliedTimelineFilters.moodOperator !== 'eq'
              ? (
                  <>
                    {' '}
                    {operatorLabelByValue.get(appliedTimelineFilters.moodOperator)}
                  </>
                )
              : null}
            {' '}
            <span
              className="timeline-card-mood-dot"
              style={{
                backgroundColor: moodColors[Math.max(0, Math.min(moodColors.length - 1, appliedTimelineFilters.moodValue - 1))],
              }}
              aria-hidden
            />
            {' '}
            {t(`log.moodName${appliedTimelineFilters.moodValue}`)}
            {' '}×
          </button>
        )}
        {appliedTimelineFilters.sleepValue !== null && (
          <button
            type="button"
            className="timeline-active-filter-chip timeline-month-pill"
            onClick={onClearAppliedSleep}
          >
            {t('insights.timelineFilters.sleep')}
            {appliedTimelineFilters.sleepOperator !== 'eq'
              ? (
                  <>
                    {' '}
                    {operatorLabelByValue.get(appliedTimelineFilters.sleepOperator)}
                  </>
                )
              : null}
            {' '}
            {formatSleepHours(appliedTimelineFilters.sleepValue)}
            {' '}×
          </button>
        )}
        {appliedTimelineFilters.tags.map(tag => (
          <button
            type="button"
            key={tag}
            className="timeline-active-filter-chip timeline-month-pill"
            onClick={() => onRemoveAppliedTag(tag)}
          >
            #
            {timelineTagLabelByKey.get(tag) ?? tag}
            {' '}×
          </button>
        ))}
      </div>
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
      <button
        type="button"
        className={`timeline-filter-fab ${isFilterSheetOpen ? 'is-sheet-open' : ''}`}
        aria-label={t('common.filter')}
        title={t('common.filter')}
        onClick={handleOpenFilter}
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
              <div className="timeline-filter-sheet-content">
                <div className="timeline-filter-section">
                  <button
                    type="button"
                    className="timeline-filter-section-toggle"
                    onClick={() => setIsMoodSectionOverride(prev => !(prev ?? draftTimelineFilters.moodValue !== null))}
                    aria-expanded={isMoodSectionOpen}
                  >
                    <span className="timeline-filter-section-heading">
                      <Smile className="timeline-filter-section-icon" size={16} aria-hidden />
                      <span className="timeline-filter-section-title">{t('insights.timelineFilters.mood')}</span>
                    </span>
                    <ChevronDown
                      size={18}
                      className={`timeline-filter-section-chevron ${isMoodSectionOpen ? 'open' : ''}`}
                      aria-hidden
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isMoodSectionOpen && (
                      <motion.div
                        className="timeline-filter-section-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={sectionTransition}
                      >
                        <div className="timeline-filter-operator-row">
                          {operatorOptions.map(option => (
                            <button
                              type="button"
                              key={option.value}
                              className={`ghost ${
                                draftTimelineFilters.moodOperator === option.value
                                && (
                                  draftTimelineFilters.moodValue !== null
                                  || draftTimelineFilters.moodOperator !== 'eq'
                                  || isMoodOperatorTouched
                                )
                                  ? 'active'
                                  : ''
                              }`}
                              onClick={() => {
                                setIsMoodOperatorTouched(true)
                                onDraftMoodOperatorChange(option.value)
                              }}
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="timeline-filter-section">
                  <button
                    type="button"
                    className="timeline-filter-section-toggle"
                    onClick={() => setIsSleepSectionOverride(prev => !(prev ?? draftTimelineFilters.sleepValue !== null))}
                    aria-expanded={isSleepSectionOpen}
                  >
                    <span className="timeline-filter-section-heading">
                      <Moon className="timeline-filter-section-icon" size={16} aria-hidden />
                      <span className="timeline-filter-section-title">{t('insights.timelineFilters.sleep')}</span>
                    </span>
                    <ChevronDown
                      size={18}
                      className={`timeline-filter-section-chevron ${isSleepSectionOpen ? 'open' : ''}`}
                      aria-hidden
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isSleepSectionOpen && (
                      <motion.div
                        className="timeline-filter-section-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={sectionTransition}
                      >
                        <div className="timeline-filter-operator-row">
                          {operatorOptions.map(option => (
                            <button
                              type="button"
                              key={option.value}
                              className={`ghost ${draftTimelineFilters.sleepValue !== null && draftTimelineFilters.sleepOperator === option.value ? 'active' : ''}`}
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
                            value={sleepSliderValue}
                            onChange={event => onDraftSleepValueChange(Number(event.target.value))}
                          />
                          <div className="timeline-sleep-slider-meta">
                            <span>0h</span>
                            <strong>{formatSleepHours(sleepSliderValue)}</strong>
                            <span>12h</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="timeline-filter-section">
                  <button
                    type="button"
                    className="timeline-filter-section-toggle"
                    onClick={() => setIsEventsSectionOverride(prev => !(prev ?? draftTimelineFilters.tags.length > 0))}
                    aria-expanded={isEventsSectionOpen}
                  >
                    <span className="timeline-filter-section-heading">
                      <svg
                        viewBox="0 0 24 24"
                        className="timeline-filter-section-icon"
                        width="16"
                        height="16"
                        aria-hidden="true"
                      >
                        <path
                          d="M8 6h13M8 12h13M8 18h13"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <circle cx="4" cy="6" r="1.5" fill="currentColor" />
                        <circle cx="4" cy="12" r="1.5" fill="currentColor" />
                        <circle cx="4" cy="18" r="1.5" fill="currentColor" />
                      </svg>
                      <span className="timeline-filter-section-title">{t('insights.dailyEvents')}</span>
                    </span>
                    <ChevronDown
                      size={18}
                      className={`timeline-filter-section-chevron ${isEventsSectionOpen ? 'open' : ''}`}
                      aria-hidden
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isEventsSectionOpen && (
                      <motion.div
                        className="timeline-filter-section-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={sectionTransition}
                      >
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
                        <div className="timeline-filter-tags-fade-wrap">
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
                      </motion.div>
                    )}
                  </AnimatePresence>
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
