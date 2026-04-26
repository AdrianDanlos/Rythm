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
  /** Shown when this tag has a stored custom color; clears it and uses the automatic (hash) color. */
  resetToDefault?: { label: string, onClick: () => void }
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
  resetToDefault,
}: TagColorPickerProps) => {
  const [draftColor, setDraftColor] = useState(color)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const initialFocusRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setDraftColor(color)
  }, [isOpen, color])

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
        <div
          className={resetToDefault
            ? 'tag-color-modal-footer tag-color-modal-footer--with-reset'
            : 'tag-color-modal-footer'}
        >
          {resetToDefault
            ? (
                <button
                  type="button"
                  className="link-button link-button--text tag-color-modal-reset"
                  onClick={resetToDefault.onClick}
                >
                  {resetToDefault.label}
                </button>
              )
            : null}
          <div className="modal-actions modal-actions-right tag-color-modal-footer-actions">
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
    </div>
  )
}
