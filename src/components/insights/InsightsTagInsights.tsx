import type { TagDriver, TagSleepDriver } from '../../lib/types/stats'
import { tagMoodDriverRelativeDelta } from '../../lib/utils/tagInsights'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatSleepHours } from '../../lib/utils/sleepHours'
import { requestScrollToLogDailyEventsInput } from '../../hooks/useScrollToLogDailyEventsOnMount'
import { ChevronRight, Moon, Smile, TrendingDown, TrendingUp } from 'lucide-react'

type InsightsTagInsightsProps = {
  isPro: boolean
  tagDrivers: TagDriver[]
  tagSleepDrivers: TagSleepDriver[]
  onOpenPaywall: () => void
  goToLog: () => void
  onOpenTagInTimeline: (tag: string) => void
  eventInsightsMinCount: number
  /** Days left to unlock real event insights; shown in preview banner when previewLabel is set. */
  previewDaysRemaining?: number
  /** When set, shows an "Example data" badge and renders tag rows as non-interactive. */
  previewLabel?: string
}
const FREE_VISIBLE_PER_SECTION = 2

export const InsightsTagInsights = ({
  isPro,
  tagDrivers,
  tagSleepDrivers,
  onOpenPaywall,
  goToLog,
  onOpenTagInTimeline,
  eventInsightsMinCount,
  previewDaysRemaining,
  previewLabel,
}: InsightsTagInsightsProps) => {
  const { t } = useTranslation()
  const isPreview = Boolean(previewLabel)
  const [showAllTags, setShowAllTags] = useState(false)
  const shouldShowAll = isPro && showAllTags

  const allPositiveDrivers = useMemo(
    () => [...tagDrivers]
      .filter(driver => typeof driver.delta === 'number' && driver.delta > 0)
      .sort((a, b) => tagMoodDriverRelativeDelta(b) - tagMoodDriverRelativeDelta(a)),
    [tagDrivers],
  )
  const allNegativeDrivers = useMemo(
    () => [...tagDrivers]
      .filter(driver => typeof driver.delta === 'number' && driver.delta < 0)
      .sort((a, b) => tagMoodDriverRelativeDelta(a) - tagMoodDriverRelativeDelta(b)),
    [tagDrivers],
  )
  const allPositiveSleepDrivers = useMemo(
    () => [...tagSleepDrivers]
      .filter(d => typeof d.delta === 'number' && d.delta > 0)
      .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0)),
    [tagSleepDrivers],
  )
  const allNegativeSleepDrivers = useMemo(
    () => [...tagSleepDrivers]
      .filter(d => typeof d.delta === 'number' && d.delta < 0)
      .sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0)),
    [tagSleepDrivers],
  )

  const positiveDrivers = shouldShowAll ? allPositiveDrivers : allPositiveDrivers.slice(0, FREE_VISIBLE_PER_SECTION)
  const negativeDrivers = shouldShowAll ? allNegativeDrivers : allNegativeDrivers.slice(0, FREE_VISIBLE_PER_SECTION)
  const hasDrivers = positiveDrivers.length > 0 || negativeDrivers.length > 0

  const positiveSleepDrivers = shouldShowAll ? allPositiveSleepDrivers : allPositiveSleepDrivers.slice(0, FREE_VISIBLE_PER_SECTION)
  const negativeSleepDrivers = shouldShowAll ? allNegativeSleepDrivers : allNegativeSleepDrivers.slice(0, FREE_VISIBLE_PER_SECTION)
  const hasSleepDrivers = positiveSleepDrivers.length > 0 || negativeSleepDrivers.length > 0

  const lockedPositiveMoodCount = !isPro
    ? Math.max(0, allPositiveDrivers.length - FREE_VISIBLE_PER_SECTION)
    : 0
  const lockedNegativeMoodCount = !isPro
    ? Math.max(0, allNegativeDrivers.length - FREE_VISIBLE_PER_SECTION)
    : 0
  const lockedPositiveSleepCount = !isPro
    ? Math.max(0, allPositiveSleepDrivers.length - FREE_VISIBLE_PER_SECTION)
    : 0
  const lockedNegativeSleepCount = !isPro
    ? Math.max(0, allNegativeSleepDrivers.length - FREE_VISIBLE_PER_SECTION)
    : 0

  const hasMoreMoodToShow = allPositiveDrivers.length > FREE_VISIBLE_PER_SECTION
    || allNegativeDrivers.length > FREE_VISIBLE_PER_SECTION
  const hasMoreSleepToShow = allPositiveSleepDrivers.length > FREE_VISIBLE_PER_SECTION
    || allNegativeSleepDrivers.length > FREE_VISIBLE_PER_SECTION

  const moodDeltaPercent = (tag: TagDriver): number | null => {
    if (tag.delta === null || tag.moodWithout === null || tag.moodWithout === 0) return null
    return (tag.delta / tag.moodWithout) * 100
  }

  const renderSleepDelta = (delta: number | null) => {
    if (delta === null) return '—'
    const isUp = delta >= 0
    const Icon = isUp ? TrendingUp : TrendingDown
    const formatted = formatSleepHours(Math.abs(delta))
    const sign = delta >= 0 ? '+' : '−'
    return (
      <span className="tag-delta-value">
        <span className={isUp ? 'mood-by-sleep-percent--up' : 'mood-by-sleep-percent--down'}>
          {sign}{formatted}
        </span>
        <span
          className={`mood-by-sleep-trend ${isUp ? 'mood-by-sleep-trend--up' : 'mood-by-sleep-trend--down'}`}
          aria-label={isUp ? t('insights.increaseAria') : t('insights.decreaseAria')}
          role="img"
        >
          <Icon size={16} aria-hidden="true" />
        </span>
      </span>
    )
  }

  const renderDeltaPercent = (percent: number | null) => {
    if (percent === null) return '—'
    const isUp = percent >= 0
    const Icon = isUp ? TrendingUp : TrendingDown
    return (
      <span className="tag-delta-value">
        <span className={isUp ? 'mood-by-sleep-percent--up' : 'mood-by-sleep-percent--down'}>
          {Math.abs(percent).toFixed(0)}%
        </span>
        <span
          className={`mood-by-sleep-trend ${isUp ? 'mood-by-sleep-trend--up' : 'mood-by-sleep-trend--down'}`}
          aria-label={isUp ? t('insights.increaseAria') : t('insights.decreaseAria')}
          role="img"
        >
          <Icon size={16} aria-hidden="true" />
        </span>
      </span>
    )
  }

  const maxAbsDelta = Math.max(
    0,
    ...positiveDrivers.map(driver => Math.abs(driver.delta ?? 0)),
    ...negativeDrivers.map(driver => Math.abs(driver.delta ?? 0)),
  )

  const maxAbsSleepDelta = Math.max(
    0,
    ...positiveSleepDrivers.map(d => Math.abs(d.delta ?? 0)),
    ...negativeSleepDrivers.map(d => Math.abs(d.delta ?? 0)),
  )

  const buildDeltaWidth = (delta: number | null) => {
    if (delta === null || maxAbsDelta === 0) return 0
    return Math.min(100, Math.max(0, (Math.abs(delta) / maxAbsDelta) * 100))
  }

  const buildSleepDeltaWidth = (delta: number | null) => {
    if (delta === null || maxAbsSleepDelta === 0) return 0
    return Math.min(100, Math.max(0, (Math.abs(delta) / maxAbsSleepDelta) * 100))
  }

  const renderMoodRowInner = (tag: TagDriver) => (
    <>
      <div className="tag-bar-header">
        <p className="tag-title">{tag.tag}</p>
        <span className="tag-bar-header-meta">
          <p className="tag-delta tag-delta--pc">{renderDeltaPercent(moodDeltaPercent(tag))} {t('insights.moodSuffix')}</p>
        </span>
      </div>
      <div className="tag-bar-delta-and-track">
        <p className="tag-delta tag-delta--mobile">{renderDeltaPercent(moodDeltaPercent(tag))} {t('insights.moodSuffix')}</p>
        <div className="tag-bar-track" aria-hidden="true">
          <span
            className="tag-bar-fill"
            style={{ width: `${buildDeltaWidth(tag.delta)}%` }}
          />
        </div>
      </div>
      <p className="helper">
        {tag.moodWith != null && (
          <>
            {tag.moodWith.toFixed(1)}/5
            {' — '}
          </>
        )}
        {t('insights.entriesSuffix', { count: tag.count })}
      </p>
    </>
  )

  const renderMoodRow = (tag: TagDriver, variant: 'positive' | 'negative') => {
    if (isPreview) {
      return (
        <div className={`tag-bar-item tag-bar-item--preview ${variant}`} key={tag.tag}>
          {renderMoodRowInner(tag)}
        </div>
      )
    }
    return (
      <button
        type="button"
        className={`tag-bar-item tag-bar-item--interactive ${variant}`}
        key={tag.tag}
        onClick={() => onOpenTagInTimeline(tag.tag)}
        aria-label={t('insights.openTagTimelineAria', { tag: tag.tag })}
      >
        <ChevronRight className="tag-bar-open-icon" size={22} aria-hidden />
        {renderMoodRowInner(tag)}
      </button>
    )
  }

  const renderSleepRowInner = (d: TagSleepDriver) => (
    <>
      <div className="tag-bar-header">
        <p className="tag-title">{d.tag}</p>
        <span className="tag-bar-header-meta">
          <p className="tag-delta tag-delta--pc">{renderSleepDelta(d.delta)}</p>
        </span>
      </div>
      <div className="tag-bar-delta-and-track">
        <p className="tag-delta tag-delta--mobile">{renderSleepDelta(d.delta)}</p>
        <div className="tag-bar-track" aria-hidden="true">
          <span
            className="tag-bar-fill"
            style={{ width: `${buildSleepDeltaWidth(d.delta)}%` }}
          />
        </div>
      </div>
      <p className="helper">
        {d.sleepWith != null && (
          <>
            {formatSleepHours(d.sleepWith)}
            {' — '}
          </>
        )}
        {t('insights.daysSuffix', { count: d.count })}
      </p>
    </>
  )

  const renderSleepRow = (d: TagSleepDriver, variant: 'positive' | 'negative') => {
    if (isPreview) {
      return (
        <div className={`tag-bar-item tag-bar-item--preview ${variant}`} key={d.tag}>
          {renderSleepRowInner(d)}
        </div>
      )
    }
    return (
      <button
        type="button"
        className={`tag-bar-item tag-bar-item--interactive ${variant}`}
        key={d.tag}
        onClick={() => onOpenTagInTimeline(d.tag)}
        aria-label={t('insights.openTagTimelineAria', { tag: d.tag })}
      >
        <ChevronRight className="tag-bar-open-icon" size={22} aria-hidden />
        {renderSleepRowInner(d)}
      </button>
    )
  }

  const renderSectionLabelRow = (label: string, showPreviewBadge = false) => (
    <div className="tag-driver-section__label-row">
      <p className="label">{label}</p>
      {showPreviewBadge && previewLabel
        ? (
            <span className="chart-card__preview-badge" aria-label={previewLabel}>
              {previewLabel}
            </span>
          )
        : null}
    </div>
  )

  const renderSleepDriverSection = (
    label: string,
    variant: 'positive' | 'negative',
    drivers: TagSleepDriver[],
    lockedCount = 0,
    showPreviewBadge = false,
  ) => {
    if (drivers.length === 0 && lockedCount === 0) return null
    return (
      <div className="tag-driver-section">
        {renderSectionLabelRow(label, showPreviewBadge)}
        <div className="tag-bar-list">
          {drivers.map(d => renderSleepRow(d, variant))}
          {lockedCount > 0 && (
            <button
              type="button"
              className={`tag-bar-item tag-bar-item--locked ${variant}`}
              onClick={onOpenPaywall}
              aria-label={`${t('insights.upgradeToPro')} (+${lockedCount})`}
            >
              <div className="tag-bar-header">
                <p className="tag-title">{t('insights.upgradeToPro')}</p>
                <p className="tag-delta">+{lockedCount}</p>
              </div>
              <p className="helper">{t('insights.showAllTags')}</p>
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="tag-insights-page-intro">
        <div className="tag-insights-page-intro-header">
          <div className="tag-insights-page-intro-heading">
            <h2 id="tag-insights-daily-events-heading">{t('insights.dailyEventsInsights')}</h2>
          </div>
        </div>
        <p className="muted">{t('insights.eventsInfluence')}</p>
        {isPreview && typeof previewDaysRemaining === 'number' && (
          <p className="tag-insights-preview-banner" role="note">
            {t('insights.eventsPreviewBannerIntro')}
            {' '}
            <button
              type="button"
              className="link-button link-button--text tag-insights-preview-banner__cta"
              onClick={() => {
                requestScrollToLogDailyEventsInput()
                goToLog()
              }}
            >
              {previewDaysRemaining === 1
                ? t('insights.logOneMoreDayWithEvents')
                : t('insights.logMoreDaysWithEvents', { count: previewDaysRemaining })}
            </button>
            {' '}
            {t('insights.eventsPreviewBannerOutro')}
          </p>
        )}
      </div>
      {(hasDrivers || hasSleepDrivers)
        ? (
            <>
              <section
                className="card"
                aria-labelledby="tag-insights-mood-heading"
              >
                <div className="tag-insights-block-header">
                  <Smile className="tag-insights-block-icon tag-insights-block-icon--mood" size={18} aria-hidden />
                  <h3 className="tag-insights-block-title" id="tag-insights-mood-heading">{t('insights.eventsPredictMood')}</h3>
                </div>
                {(positiveDrivers.length > 0 || negativeDrivers.length > 0 || lockedPositiveMoodCount > 0 || lockedNegativeMoodCount > 0)
                  ? (
                      <>
                        {(positiveDrivers.length > 0 || lockedPositiveMoodCount > 0) && (
                          <div className="tag-driver-section">
                            {renderSectionLabelRow(t('insights.positive'), true)}
                            <div className="tag-bar-list">
                              {positiveDrivers.map(tag => renderMoodRow(tag, 'positive'))}
                              {lockedPositiveMoodCount > 0 && (
                                <button
                                  type="button"
                                  className="tag-bar-item tag-bar-item--locked positive"
                                  onClick={onOpenPaywall}
                                  aria-label={`${t('insights.upgradeToPro')} (+${lockedPositiveMoodCount})`}
                                >
                                  <div className="tag-bar-header">
                                    <p className="tag-title">{t('insights.upgradeToPro')}</p>
                                    <p className="tag-delta">+{lockedPositiveMoodCount}</p>
                                  </div>
                                  <p className="helper">{t('insights.showAllTags')}</p>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        {(negativeDrivers.length > 0 || lockedNegativeMoodCount > 0) && (
                          <div className="tag-driver-section">
                            <p className="label">{t('insights.negative')}</p>
                            <div className="tag-bar-list">
                              {negativeDrivers.map(tag => renderMoodRow(tag, 'negative'))}
                              {lockedNegativeMoodCount > 0 && (
                                <button
                                  type="button"
                                  className="tag-bar-item tag-bar-item--locked negative"
                                  onClick={onOpenPaywall}
                                  aria-label={`${t('insights.upgradeToPro')} (+${lockedNegativeMoodCount})`}
                                >
                                  <div className="tag-bar-header">
                                    <p className="tag-title">{t('insights.upgradeToPro')}</p>
                                    <p className="tag-delta">+{lockedNegativeMoodCount}</p>
                                  </div>
                                  <p className="helper">{t('insights.showAllTags')}</p>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )
                  : (
                      <p className="muted">{t('insights.addEventsToSeeMoodImpact', { count: eventInsightsMinCount })}</p>
                    )}
                {isPro && hasMoreMoodToShow && (
                  <div className="tag-insights-show-more">
                    <button
                      type="button"
                      className="link-button link-button--text"
                      onClick={() => setShowAllTags(prev => !prev)}
                    >
                      {showAllTags ? t('insights.showTopTags') : t('insights.showAllTags')}
                    </button>
                  </div>
                )}
              </section>
              <section
                className="card"
                aria-labelledby="tag-insights-sleep-heading"
              >
                <div className="tag-insights-block-header">
                  <Moon className="tag-insights-block-icon tag-insights-block-icon--sleep" size={18} aria-hidden />
                  <h3 className="tag-insights-block-title" id="tag-insights-sleep-heading">{t('insights.eventsPredictSleep')}</h3>
                </div>
                {(positiveSleepDrivers.length > 0 || negativeSleepDrivers.length > 0 || lockedPositiveSleepCount > 0 || lockedNegativeSleepCount > 0)
                  ? (
                      <>
                        {renderSleepDriverSection(
                          t('insights.moreSleepAfter'),
                          'positive',
                          positiveSleepDrivers,
                          lockedPositiveSleepCount,
                          true,
                        )}
                        {renderSleepDriverSection(
                          t('insights.lessSleepAfter'),
                          'negative',
                          negativeSleepDrivers,
                          lockedNegativeSleepCount,
                        )}
                      </>
                    )
                  : (
                      <p className="muted">{t('insights.addEventsToSeeSleepImpact', { count: eventInsightsMinCount })}</p>
                    )}
                {isPro && hasMoreSleepToShow && (
                  <div className="tag-insights-show-more">
                    <button
                      type="button"
                      className="link-button link-button--text"
                      onClick={() => setShowAllTags(prev => !prev)}
                    >
                      {showAllTags ? t('insights.showTopTags') : t('insights.showAllTags')}
                    </button>
                  </div>
                )}
              </section>
            </>
          )
        : (
            <p className="muted">
              <button type="button" className="link-button link-button--text" onClick={goToLog}>{t('insights.addDailyEvents')}</button>
              {' '}{t('insights.addEventsToUnlock', { count: eventInsightsMinCount })}
            </p>
          )}
    </>
  )
}
