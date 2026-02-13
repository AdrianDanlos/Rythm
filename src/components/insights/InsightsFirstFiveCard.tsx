import { motion, useReducedMotion } from 'framer-motion'
import type { Entry } from '../../lib/entries'
import { formatSleepHours } from '../../lib/utils/sleepHours'
import { cardEnter, motionTransitionSlow, progressEnter } from '../../lib/motion'

const UNLOCK_DAYS = 5

type InsightsFirstFiveCardProps = {
  entries: Entry[]
  goToLog: () => void
}

export const InsightsFirstFiveCard = ({ entries, goToLog }: InsightsFirstFiveCardProps) => {
  const reduceMotion = useReducedMotion()
  const sorted = [...entries].sort((a, b) => b.entry_date.localeCompare(a.entry_date))
  const last = sorted[0]
  if (!last) return null

  const sleep = last.sleep_hours != null && Number.isFinite(Number(last.sleep_hours))
    ? Number(last.sleep_hours)
    : null
  const mood = last.mood != null && Number.isFinite(Number(last.mood))
    ? Number(last.mood)
    : null
  const n = entries.length
  const progress = Math.min(n, UNLOCK_DAYS)
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
        <p className="eyebrow">Summary</p>
        <h2>You're building your first week</h2>
      </div>
      <p className="insights-first-five-card__data">{`You've logged ${n} days`}{hasAnyData ? ' — last:' : '.'}</p>
      {hasAnyData && (
        <div className="insights-first-five-card__data-row" role="list" aria-label="Last night summary">
          {hasSleep && (
            <div className="insights-first-five-card__data-item" role="listitem">
              <span className="insights-first-five-card__data-item-label">Sleep</span>
              <span className="insights-first-five-card__data-item-value">{formatSleepHours(sleep!)}</span>
            </div>
          )}
          {hasMood && (
            <div className="insights-first-five-card__data-item" role="listitem">
              <span className="insights-first-five-card__data-item-label">Mood</span>
              <span className="insights-first-five-card__data-item-value">{mood!.toFixed(1)} / 5</span>
            </div>
          )}
        </div>
      )}
      <p className="insights-first-five-card__unlock muted">
        <button type="button" className="link-button link-button--text" onClick={goToLog}>
          Log {UNLOCK_DAYS - n} more {UNLOCK_DAYS - n === 1 ? 'day' : 'days'}
        </button>
        {' '}to unlock: Rhythm score, sleep–mood link, and more badges.
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
