import { useState } from 'react'
import { useTranslation } from 'react-i18next'

type DailyReminderNudgeModalProps = {
  isOpen: boolean
  onAllow: () => Promise<void> | void
  onDismiss: () => void
}

export function DailyReminderNudgeModal({
  isOpen,
  onAllow,
  onDismiss,
}: DailyReminderNudgeModalProps) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)

  if (!isOpen) return null

  const handleAllow = async () => {
    if (busy) return
    setBusy(true)
    try {
      await onAllow()
    }
    finally {
      setBusy(false)
    }
  }

  const handleDismiss = () => {
    if (busy) return
    onDismiss()
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={handleDismiss}
    >
      <div
        className="modal-card daily-reminder-nudge-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-reminder-nudge-title"
        onClick={event => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="daily-reminder-nudge-title">{t('notifications.nudgeTitle')}</h2>
          </div>
          <button
            type="button"
            className="ghost icon-button"
            onClick={handleDismiss}
            disabled={busy}
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>
        <p className="muted">{t('notifications.nudgeBody')}</p>
        <div className="modal-actions daily-reminder-nudge-modal__actions">
          <button
            type="button"
            className="primary-button daily-reminder-nudge-modal__allow"
            onClick={() => { void handleAllow() }}
            disabled={busy}
          >
            {t('notifications.nudgeEnableAction')}
          </button>
          <button
            type="button"
            className="ghost daily-reminder-nudge-modal__not-now"
            onClick={handleDismiss}
            disabled={busy}
          >
            {t('notifications.nudgeNotNowAction')}
          </button>
        </div>
      </div>
    </div>
  )
}
