import { useEffect, useState, type FormEvent } from 'react'
import { createFeedback } from '../lib/feedback.ts'

type FeedbackModalProps = {
  isOpen: boolean
  onClose: () => void
  userEmail: string | null
}

type FeedbackStatus = {
  type: 'success' | 'error'
  message: string
}

export const FeedbackModal = ({
  isOpen,
  onClose,
  userEmail,
}: FeedbackModalProps) => {
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<FeedbackStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setMessage('')
      setStatus(null)
      setIsLoading(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (isLoading) return

    const trimmedMessage = message.trim()
    if (!userEmail) {
      setStatus({
        type: 'error',
        message: 'Sign in to send feedback.',
      })
      return
    }
    if (!trimmedMessage) {
      setStatus({
        type: 'error',
        message: 'Please enter your feedback.',
      })
      return
    }

    setIsLoading(true)
    setStatus(null)
    try {
      await createFeedback({
        message: trimmedMessage,
      })
      setStatus({
        type: 'success',
        message: 'Thanks for the feedback!',
      })
      setMessage('')
    }
    catch {
      setStatus({
        type: 'error',
        message: 'Unable to send feedback. Please try again.',
      })
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
            <p className="eyebrow">Feedback</p>
            <h2 id="feedback-title">Share your thoughts</h2>
          </div>
          <button
            type="button"
            className="ghost icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="muted">
          {!userEmail
            ? 'Sign in to send feedback.'
            : null}
        </p>
        <form className="feedback-form" onSubmit={handleSubmit}>
          <textarea
            id="feedback-message"
            className="feedback-textarea"
            placeholder="Share what you love, what feels off, or ideas to improve Rythm."
            value={message}
            onChange={event => setMessage(event.target.value)}
            rows={5}
            disabled={!userEmail || isLoading}
          />
          <p
            className={
              status
                ? `feedback-status ${status.type === 'error' ? 'error' : 'success'}`
                : 'feedback-status is-empty'
            }
          >
            {status?.message ?? ''}
          </p>
          <div className="modal-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={!canSubmit}
            >
              {isLoading ? 'Sending...' : 'Send feedback'}
            </button>
            <button type="button" className="ghost" onClick={onClose}>
              Not now
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
