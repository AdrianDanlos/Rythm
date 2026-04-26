import { useTranslation } from 'react-i18next'

type ReviewPromptModalProps = {
  isOpen: boolean
  onConfirmYes: () => void
  onLater: () => void
  onNotReally: () => void
}

export const ReviewPromptModal = ({
  isOpen,
  onConfirmYes,
  onLater,
  onNotReally,
}: ReviewPromptModalProps) => {
  const { t } = useTranslation()

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" role="presentation" onClick={onLater}>
      <div
        className="modal-card review-prompt-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-prompt-title"
        onClick={event => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="review-prompt-title">{t('reviewPrompt.title')}</h2>
          </div>
          <button
            type="button"
            className="ghost icon-button"
            onClick={onLater}
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>
        <p className="muted">{t('reviewPrompt.body')}</p>
        <div className="modal-actions review-prompt-modal__actions">
          <button type="button" className="primary-button review-prompt-modal__yes" onClick={onConfirmYes}>
            {t('reviewPrompt.yes')}
          </button>
          <button type="button" className="ghost review-prompt-modal__later" onClick={onLater}>
            {t('reviewPrompt.later')}
          </button>
          <button type="button" className="ghost review-prompt-modal__not-really" onClick={onNotReally}>
            {t('reviewPrompt.notReally')}
          </button>
        </div>
      </div>
    </div>
  )
}
