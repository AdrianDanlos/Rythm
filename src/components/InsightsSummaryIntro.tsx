import { motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { cardEnter } from '../lib/motion'

type InsightsSummaryIntroProps = {
  entryCount: number
  entriesLoading: boolean
  goToLog: () => void
}

export const InsightsSummaryIntro = ({ entryCount, entriesLoading, goToLog }: InsightsSummaryIntroProps) => {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  if (entriesLoading || entryCount > 1) return null

  return (
    <motion.section
      className="card insights-intro insights-summary-intro"
      {...(reduceMotion ? {} : cardEnter)}
      transition={reduceMotion ? { duration: 0 } : undefined}
    >
      <div className="insights-intro__header">
        <div>
          <p className="eyebrow">{t('nav.summary')}</p>
          <h2>{t('insights.summaryTitle')}</h2>
        </div>
      </div>
      <p className="insights-summary-intro__copy">
        {t('insights.summaryIntro')}{' '}
        <button type="button" className="link-button link-button--text" onClick={goToLog}>
          {t('insights.logFirstDay')}
        </button>
        {' '}{t('insights.toGetStarted')}
      </p>
    </motion.section>
  )
}
