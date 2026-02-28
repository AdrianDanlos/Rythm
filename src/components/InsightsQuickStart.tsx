import { useTranslation } from 'react-i18next'

type InsightsQuickStartProps = {
  goToLog: () => void
  hasNoEntries: boolean
}

export const InsightsQuickStart = ({ goToLog, hasNoEntries }: InsightsQuickStartProps) => {
  const { t } = useTranslation()
  if (!hasNoEntries) return null

  return (
    <section className="card insights-intro">
      <div className="insights-intro__header">
        <div>
          <p className="eyebrow">{t('insights.quickStart')}</p>
          <h2>{t('insights.quickStartTitle')}</h2>
        </div>
      </div>
      <div className="insights-intro__steps">
        <div className="intro-step">
          <span className="intro-step__number">1</span>
          <p>{t('insights.step1')}</p>
        </div>
        <div className="intro-step">
          <span className="intro-step__number">2</span>
          <p>{t('insights.step2')}</p>
        </div>
        <div className="intro-step">
          <span className="intro-step__number">3</span>
          <p>{t('insights.step3')}</p>
        </div>
      </div>
      <div className="insights-intro__actions">
        <button
          className="primary-button cta-button"
          type="button"
          onClick={goToLog}
        >
          {t('insights.logToday')}
        </button>
      </div>
    </section>
  )
}
