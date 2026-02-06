import { useEffect, useState, type FormEvent } from 'react'
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
      toast.error('Sign in to send feedback.')
      onClose()
      return
    }
    if (!trimmedMessage) {
      toast.error('Please enter your feedback.')
      onClose()
      return
    }

    setIsLoading(true)
    try {
      await createFeedback({
        message: trimmedMessage,
      })
      toast.success('Thanks for the feedback!')
      setMessage('')
      onClose()
    }
    catch {
      toast.error('Unable to send feedback. Please try again.')
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
          <div className="modal-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={!canSubmit}
            >
              {isLoading ? 'Sending...' : 'Send feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
