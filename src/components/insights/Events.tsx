import { Info, Pencil } from 'lucide-react'
import { motion, type Transition } from 'framer-motion'
import type { TagDriver, TagSleepDriver } from '../../lib/types/stats'
import { tagColorPalette } from '../../lib/colors'
import { MAX_TAG_LENGTH } from '../../lib/utils/stringUtils'
import { TagColorPicker } from '../TagColorPicker'
import { Tooltip } from '../Tooltip'
import { InsightsTagInsights } from './InsightsTagInsights'
import { NoDailyEventsLoggedHint } from './NoDailyEventsLoggedHint'

export type EventsProps = {
  reduceMotion: boolean | null
  panelTransition: Transition
  topTags: { display: string, count: number }[]
  visibleTags: { display: string, count: number }[]
  editingTag: string | null
  editingValue: string
  onEditingValueChange: (value: string) => void
  onCommitEditingTag: () => void
  onCancelEditingTag: () => void
  onStartEditingTag: (tag: string) => void
  tagColors: Record<string, string>
  onSetColorPickerTag: (tag: string | null) => void
  colorPickerTag: string | null
  onTagColorChange: (tag: string, color: string) => void
  showAllTags: boolean
  onToggleShowAllTags: () => void
  goToLog: () => void
  onOpenTagInTimeline: (tag: string) => void
  hasEnoughEntries: boolean
  isPro: boolean
  tagDrivers: TagDriver[]
  tagSleepDrivers: TagSleepDriver[]
  onOpenPaywall: () => void
  t: (key: string, options?: Record<string, unknown>) => string
}

export const Events = ({
  reduceMotion,
  panelTransition,
  topTags,
  visibleTags,
  editingTag,
  editingValue,
  onEditingValueChange,
  onCommitEditingTag,
  onCancelEditingTag,
  onStartEditingTag,
  tagColors,
  onSetColorPickerTag,
  colorPickerTag,
  onTagColorChange,
  showAllTags,
  onToggleShowAllTags,
  goToLog,
  onOpenTagInTimeline,
  hasEnoughEntries,
  isPro,
  tagDrivers,
  tagSleepDrivers,
  onOpenPaywall,
  t,
}: EventsProps) => {
  return (
    <motion.div
      className="insights-panel"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={panelTransition}
    >
      <section className="card">
        <div className="card-header">
          <div className="your-daily-events-heading">
            <h2>{t('insights.yourDailyEvents')}</h2>
            <Tooltip label={t('insights.tagColorRandomTooltip')}>
              <span
                className="tooltip-trigger"
                tabIndex={0}
                aria-label={t('insights.tagColorRandomTooltip')}
              >
                <span className="tooltip-icon" aria-hidden="true">
                  <Info size={14} />
                </span>
              </span>
            </Tooltip>
          </div>
        </div>
        {topTags.length > 0
          ? (
              <>
                <ul className="your-daily-events-list">
                  {visibleTags.map(({ display, count }) => {
                    const isEditing = editingTag === display
                    const colorKey = display.trim().toLowerCase()
                    const hasExplicitColor = !!tagColors[colorKey]
                    const tagColor = hasExplicitColor ? tagColors[colorKey] : '#ffffff'
                    return (
                      <li
                        key={display}
                        className="your-daily-events-list-item"
                      >
                        {isEditing
                          ? (
                              <div className="field your-daily-events-edit-input">
                                <input
                                  type="text"
                                  value={editingValue}
                                  onChange={e => onEditingValueChange(e.target.value.slice(0, MAX_TAG_LENGTH))}
                                  onBlur={onCommitEditingTag}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      onCommitEditingTag()
                                    }
                                    else if (e.key === 'Escape') {
                                      e.preventDefault()
                                      onCancelEditingTag()
                                    }
                                  }}
                                  autoFocus
                                />
                              </div>
                            )
                          : (
                              <>
                                <span className="your-daily-events-list-label">
                                  {t('insights.dailyEventCount', { tag: display, count })}
                                </span>
                                <div className="your-daily-events-item-actions">
                                  <button
                                    type="button"
                                    className="tag-color-trigger"
                                    style={{ backgroundColor: tagColor }}
                                    onClick={() => onSetColorPickerTag(display)}
                                    aria-label={t('insights.changeTagColor', { tag: display })}
                                  >
                                    <span className="tag-color-trigger-inner" />
                                  </button>
                                  <button
                                    type="button"
                                    className="ghost icon-button your-daily-events-edit-button"
                                    onClick={() => onStartEditingTag(display)}
                                    aria-label={t('common.edit')}
                                  >
                                    <Pencil className="icon" aria-hidden />
                                  </button>
                                </div>
                              </>
                            )}
                      </li>
                    )
                  })}
                </ul>
                {topTags.length > 4 && (
                  <div className="tag-insights-show-more">
                    <button
                      type="button"
                      className="link-button link-button--text your-daily-events-toggle"
                      onClick={onToggleShowAllTags}
                    >
                      {showAllTags
                        ? t('insights.showTopTags')
                        : t('insights.showAllTags')}
                    </button>
                  </div>
                )}
              </>
            )
          : (
              <NoDailyEventsLoggedHint onGoToLog={goToLog} />
            )}
      </section>
      <TagColorPicker
        key={colorPickerTag ?? 'closed'}
        color={(() => {
          if (!colorPickerTag) return '#ffffff'
          const key = colorPickerTag.trim().toLowerCase()
          return tagColors[key] ?? tagColorPalette[0]
        })()}
        isOpen={!!colorPickerTag}
        title={t('insights.changeTagColorTitle')}
        description={t('insights.changeTagColorDescription')}
        confirmLabel={t('common.save')}
        cancelLabel={t('common.cancel')}
        onCancel={() => onSetColorPickerTag(null)}
        onConfirm={(nextColor) => {
          if (colorPickerTag) {
            onTagColorChange(colorPickerTag, nextColor)
          }
          onSetColorPickerTag(null)
        }}
      />
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
    </motion.div>
  )
}
