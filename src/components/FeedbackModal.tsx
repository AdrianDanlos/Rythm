import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { createFeedback } from '../lib/feedback.ts'

type FeedbackModalProps = {
  isOpen: boolean
  onClose: () => void
  userEmail: string | null
}

export const FeedbackModal = ({
  isOpen,
  onClose,
  userEmail,
}: FeedbackModalProps) => {
  const { t } = useTranslation()
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setMessage('')
      setIsLoading(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (isLoading) return

    const trimmedMessage = message.trim()
    if (!userEmail) {
      toast.error(t('feedback.signInRequired'))
      onClose()
      return
    }
    if (!trimmedMessage) {
      toast.error(t('feedback.enterFeedback'))
      onClose()
      return
    }

    setIsLoading(true)
    try {
      await createFeedback({
        message: trimmedMessage,
      })
      toast.success(t('feedback.thanks'))
      setMessage('')
      onClose()
    }
    catch {
      toast.error(t('feedback.sendError'))
      onClose()
    }
    finally {
      setIsLoading(false)
    }
  }

  const canSubmit = Boolean(userEmail && message.trim() && !isLoading)

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        onClick={event => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">{t('feedback.eyebrow')}</p>
            <h2 id="feedback-title">{t('feedback.title')}</h2>
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
          {!userEmail
            ? t('feedback.signInRequired')
            : null}
        </p>
        <form className="feedback-form" onSubmit={handleSubmit}>
          <textarea
            id="feedback-message"
            className="feedback-textarea"
            placeholder={t('feedback.placeholder')}
            value={message}
            onChange={event => setMessage(event.target.value)}
            rows={5}
            disabled={!userEmail || isLoading}
          />
          <div className="modal-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={!canSubmit}
            >
              {isLoading ? t('feedback.sending') : t('feedback.send')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
