import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, Info, Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Entry } from '../../lib/entries'
import { tagColorPalette } from '../../lib/colors'
import { MAX_TAG_LENGTH } from '../../lib/utils/stringUtils'
import { TagColorPicker } from '../TagColorPicker'
import { Tooltip } from '../Tooltip'
import { NoDailyEventsLoggedHint } from './NoDailyEventsLoggedHint'

type DailyEventsEditPageProps = {
  entries: Entry[]
  tagColors: Record<string, string>
  onRenameTag: (fromTag: string, toTag: string) => void
  onTagColorChange: (tag: string, color: string) => void
  goToLog: () => void
  onBack: () => void
}

export function DailyEventsEditPage({
  entries,
  tagColors,
  onRenameTag,
  onTagColorChange,
  goToLog,
  onBack,
}: DailyEventsEditPageProps) {
  const { t } = useTranslation()
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [showAllTags, setShowAllTags] = useState(false)
  const [colorPickerTag, setColorPickerTag] = useState<string | null>(null)

  const topTags = useMemo(() => {
    const countByKey = new Map<string, { count: number, display: string }>()
    entries.forEach((entry) => {
      const tags = entry.tags ?? []
      tags.forEach((tag) => {
        const trimmed = tag.trim()
        if (!trimmed) return
        const key = trimmed.toLowerCase()
        const existing = countByKey.get(key)
        if (existing) {
          existing.count += 1
        }
        else {
          countByKey.set(key, { count: 1, display: trimmed })
        }
      })
    })
    return Array.from(countByKey.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([, { display, count }]) => ({ display, count }))
  }, [entries])
  const visibleTags = showAllTags ? topTags : topTags.slice(0, 4)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const closeTransientPanels = () => {
      setColorPickerTag(null)
    }
    window.addEventListener('app:close-transient-panels', closeTransientPanels)
    return () => {
      window.removeEventListener('app:close-transient-panels', closeTransientPanels)
    }
  }, [])

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

  return (
    <div className="insights-panel">
      <div className="daily-events-edit-top">
        <button
          type="button"
          className="daily-events-edit-back"
          onClick={onBack}
        >
          <ChevronLeft className="daily-events-edit-back__icon" aria-hidden />
          <span>{t('common.back')}</span>
        </button>
      </div>

      <section className="card">
        <div className="card-header">
          <div className="your-daily-events-heading">
            <h2 id="daily-events-edit-title">{t('insights.yourDailyEvents')}</h2>
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
                <ul className="your-daily-events-list" aria-labelledby="daily-events-edit-title">
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
                                  onChange={e => setEditingValue(e.target.value.slice(0, MAX_TAG_LENGTH))}
                                  onBlur={commitEditingTag}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      commitEditingTag()
                                    }
                                    else if (e.key === 'Escape') {
                                      e.preventDefault()
                                      cancelEditingTag()
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
                                    onClick={() => setColorPickerTag(display)}
                                    aria-label={t('insights.changeTagColor', { tag: display })}
                                  >
                                    <span className="tag-color-trigger-inner" />
                                  </button>
                                  <button
                                    type="button"
                                    className="ghost icon-button your-daily-events-edit-button"
                                    onClick={() => startEditingTag(display)}
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
                      onClick={() => {
                        setShowAllTags((prev) => {
                          if (prev && typeof window !== 'undefined') {
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }
                          return !prev
                        })
                      }}
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
        onCancel={() => setColorPickerTag(null)}
        onConfirm={(nextColor) => {
          if (colorPickerTag) {
            onTagColorChange(colorPickerTag, nextColor)
          }
          setColorPickerTag(null)
        }}
      />
    </div>
  )
}
