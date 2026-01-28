type InsightsExportProps = {
  entriesLength: number
  isPro: boolean
  exportReportDisabled: boolean
  onExportCsv: () => void
  onExportMonthlyReport: () => void
  onOpenPaywall: () => void
}

export const InsightsExport = ({
  entriesLength,
  isPro,
  exportReportDisabled,
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
              disabled={!entriesLength}
            >
              Export CSV
            </button>
            <button
              type="button"
              className={`ghost ${!isPro ? 'pro-locked-button' : ''}`}
              onClick={() => handleProAction(onExportMonthlyReport)}
              disabled={exportReportDisabled}
            >
              Export Report
              {!isPro ? <span className="pro-pill">Pro</span> : null}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
