import { motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Angry, Frown, Laugh, Meh, Smile } from 'lucide-react'
import type { Entry } from '../../lib/entries'
import { formatSleepHours } from '../../lib/utils/sleepHours'
import { moodColors } from '../../lib/colors'
import { cardEnter, motionTransitionSlow, progressEnter } from '../../lib/motion'

const UNLOCK_DAYS = 2
const MOOD_ICONS = {
  1: Angry,
  2: Frown,
  3: Meh,
  4: Smile,
  5: Laugh,
} as const

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
  const roundedMood = mood !== null ? Math.max(1, Math.min(5, Math.round(mood))) as keyof typeof MOOD_ICONS : null
  const MoodFaceIcon = roundedMood !== null ? MOOD_ICONS[roundedMood] : null

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
      {hasAnyData && (
        <div className="insights-first-five-card__data-row" role="list" aria-label={t('insights.firstDaySummaryAria')}>
          {hasSleep && (
            <div className="insights-first-five-card__data-item" role="listitem">
              <span className="insights-first-five-card__data-item-label">{t('common.sleep')}</span>
              <span className="insights-first-five-card__data-item-value">{formatSleepHours(sleep!)}</span>
            </div>
          )}
          {roundedMood !== null && MoodFaceIcon && (
            <div className="insights-first-five-card__data-item insights-first-five-card__data-item--mood" role="listitem">
              <span className="insights-first-five-card__data-item-label">{t('common.mood')}</span>
              <span className="insights-first-five-card__mood-value-with-icon">
                <span className="insights-first-five-card__data-item-value">{roundedMood} / 5</span>
                <MoodFaceIcon
                  className="insights-first-five-card__mood-face"
                  size={18}
                  style={{ color: moodColors[roundedMood - 1] }}
                  aria-hidden
                />
              </span>
            </div>
          )}
        </div>
      )}
      {!hasAnyData && <p className="insights-first-five-card__data insights-first-five-card__data--muted">{t('insights.yourFirstDayLogged')}</p>}
      <p className="insights-first-five-card__unlock muted">
        <button type="button" className="link-button link-button--text" onClick={goToLog}>
          {t('insights.logOneMoreDay')}
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
          {t('insights.daysProgress', { current: progress, total: UNLOCK_DAYS })}
        </p>
      </div>
    </motion.section>
  )
}
