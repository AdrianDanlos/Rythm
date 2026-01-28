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
          <p className="eyebrow">Export data</p>
          <p className="muted">Export insights to share or analyze</p>
        </div>
        <div className="insights-actions" aria-label="Export data">
          <div className="insights-actions-buttons">
            <button
              type="button"
              className="ghost"
              onClick={onExportCsv}
            >
              Export CSV
            </button>
            <button
              type="button"
              className={`ghost ${!isPro ? 'pro-locked-button' : ''}`}
              onClick={handleReportClick}
            >
              Export Report
              {!isPro ? <span className="pro-pill">Pro</span> : null}
            </button>
          </div>
          {exportError ? <p className="error">{exportError}</p> : null}
        </div>
      </div>
    </section>
  )
}
