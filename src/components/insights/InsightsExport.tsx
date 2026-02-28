import { useTranslation } from 'react-i18next'

type InsightsExportProps = {
  hasEntries: boolean
  isPro: boolean
  exportError: string | null
  onExportCsv: () => void
  onExportMonthlyReport: () => void
  onOpenPaywall: () => void
}

export const InsightsExport = ({
  hasEntries,
  isPro,
  exportError,
  onExportCsv,
  onExportMonthlyReport,
  onOpenPaywall,
}: InsightsExportProps) => {
  const { t } = useTranslation()
  const handleProAction = (action?: () => void) => {
    if (!isPro) {
      onOpenPaywall()
      return
    }
    action?.()
  }

  const handleReportClick = () => {
    if (!hasEntries) {
      onExportMonthlyReport()
      return
    }
    handleProAction(onExportMonthlyReport)
  }

  return (
    <section className="card insights-export">
      <div className="insights-header">
        <div className="insights-title">
          <p className="eyebrow">{t('insights.exportData')}</p>
          <p className="muted">{t('insights.exportSubtitle')}</p>
        </div>
        <div className="insights-actions" aria-label={t('insights.exportData')}>
          <div className="insights-actions-buttons">
            <button
              type="button"
              className="ghost"
              onClick={onExportCsv}
            >
              {t('insights.exportCsv')}
            </button>
            <button
              type="button"
              className={`ghost ${!isPro ? 'pro-locked-button' : ''}`}
              onClick={handleReportClick}
            >
              {t('insights.exportReport')}
              {!isPro ? <span className="pro-pill">{t('insights.pro')}</span> : null}
            </button>
          </div>
          {exportError ? <p className="error">{exportError}</p> : null}
        </div>
      </div>
    </section>
  )
}
