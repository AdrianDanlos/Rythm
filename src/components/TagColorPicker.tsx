import { useEffect, useRef, useState } from 'react'
import { HexColorPicker } from 'react-colorful'

type TagColorPickerProps = {
  color: string
  isOpen: boolean
  title: string
  description?: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: (color: string) => void
  onCancel: () => void
}

export const TagColorPicker = ({
  color,
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: TagColorPickerProps) => {
  const [draftColor, setDraftColor] = useState(color)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const initialFocusRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const previousActive = document.activeElement as HTMLElement | null
    initialFocusRef.current?.focus()
    return () => {
      previousActive?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    onCancel()
  }

  return (
    <div
      className="modal-backdrop tag-color-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tag-color-picker-title"
      onClick={handleBackdropClick}
    >
      <div ref={dialogRef} className="modal-card tag-color-modal">
        <div className="tag-color-modal-header">
          <div>
            <h2 id="tag-color-picker-title">{title}</h2>
            {description ? <p className="muted tag-color-modal-description">{description}</p> : null}
          </div>
          <div className="tag-color-modal-preview">
            <span
              className="tag-color-modal-preview-swatch"
              style={{ backgroundColor: draftColor }}
              aria-hidden="true"
            />
            <span className="tag-color-modal-preview-hex">{draftColor.toUpperCase()}</span>
          </div>
        </div>
        <div className="tag-color-modal-body">
          <HexColorPicker color={draftColor} onChange={setDraftColor} />
        </div>
        <div className="modal-actions modal-actions-right tag-color-modal-actions">
          <button
            ref={initialFocusRef}
            type="button"
            className="ghost"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => onConfirm(draftColor)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
