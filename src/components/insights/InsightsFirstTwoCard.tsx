import { motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { Entry } from '../../lib/entries'
import { formatSleepHours } from '../../lib/utils/sleepHours'
import { cardEnter, motionTransitionSlow, progressEnter } from '../../lib/motion'

const UNLOCK_DAYS = 2

type InsightsFirstTwoCardProps = {
  entries: Entry[]
  goToLog: () => void
}

export const InsightsFirstTwoCard = ({ entries, goToLog }: InsightsFirstTwoCardProps) => {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const last = entries[0]
  if (!last) return null

  const sleep = last.sleep_hours != null && Number.isFinite(Number(last.sleep_hours))
    ? Number(last.sleep_hours)
    : null
  const mood = last.mood != null && Number.isFinite(Number(last.mood))
    ? Number(last.mood)
    : null
  const progress = 1
  const progressPercent = (progress / UNLOCK_DAYS) * 100

  const hasSleep = sleep !== null
  const hasMood = mood !== null
  const hasAnyData = hasSleep || hasMood

  const transition = reduceMotion ? { duration: 0 } : motionTransitionSlow

  return (
    <motion.section
      className="card insights-first-five-card"
      {...(reduceMotion ? {} : cardEnter)}
      transition={reduceMotion ? { duration: 0 } : undefined}
    >
      <div className="insights-first-five-card__header">
        <p className="eyebrow">{t('insights.firstSummary')}</p>
        <h2>{t('insights.oneMoreDayToUnlock')}</h2>
      </div>
      <p className="insights-first-five-card__data-label">{t('insights.yourFirstDay')}</p>
      {hasAnyData && (
        <div className="insights-first-five-card__data-row" role="list" aria-label="First day summary">
          {hasSleep && (
            <div className="insights-first-five-card__data-item" role="listitem">
              <span className="insights-first-five-card__data-item-label">{t('common.sleep')}</span>
              <span className="insights-first-five-card__data-item-value">{formatSleepHours(sleep!)}</span>
            </div>
          )}
          {hasMood && (
            <div className="insights-first-five-card__data-item" role="listitem">
              <span className="insights-first-five-card__data-item-label">{t('common.mood')}</span>
              <span className="insights-first-five-card__data-item-value">{Math.round(mood!)} / 5</span>
            </div>
          )}
        </div>
      )}
      {!hasAnyData && <p className="insights-first-five-card__data insights-first-five-card__data--muted">{t('insights.yourFirstDayLogged')}</p>}
      <p className="insights-first-five-card__unlock muted">
        <button type="button" className="link-button link-button--text" onClick={goToLog}>
          Log 1 more day
        </button>
        {' '}{t('insights.logMoreDaysUnlock')}
      </p>
      <div className="first-five-progress">
        <div className="badge-progress-track" aria-hidden="true">
          <motion.span
            className="badge-progress-fill"
            initial={reduceMotion ? false : progressEnter.initial}
            animate={{ width: `${progressPercent}%` }}
            transition={transition}
          />
        </div>
        <p className="first-five-progress__text">
          {progress} / {UNLOCK_DAYS} days
        </p>
      </div>
    </motion.section>
  )
}
