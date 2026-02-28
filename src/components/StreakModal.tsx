import { useTranslation } from 'react-i18next'

type StreakModalProps = {
  isOpen: boolean
  onClose: () => void
}

export const StreakModal = ({ isOpen, onClose }: StreakModalProps) => {
  const { t } = useTranslation()
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="streak-title"
        onClick={event => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">{t('streak.eyebrow')}</p>
            <h2 id="streak-title">{t('streak.title')}</h2>
          </div>
          <button
            type="button"
            className="ghost icon-button"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>
        <p className="muted">
          {t('streak.body')}
        </p>
        <div className="modal-actions">
          <button type="button" className="primary-button" onClick={onClose}>
            {t('streak.cta')}
          </button>
        </div>
      </div>
    </div>
  )
}
