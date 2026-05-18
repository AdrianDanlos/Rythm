import type { FormEvent } from 'react'
import classNames from 'classnames'
import { motion } from 'framer-motion'
import type { TFunction } from 'i18next'
import { NotebookPen } from 'lucide-react'

const JOURNAL_RULE_COUNT = 32

type LogFormJournalPageProps = {
  note: string
  setNoteEditorRef: (node: HTMLDivElement | null) => void
  onNoteInput: (event: FormEvent<HTMLDivElement>) => void
  onSave: () => void
  isSaving: boolean
  isSubmitting: boolean
  t: TFunction
}

export function LogFormJournalPage({
  note,
  setNoteEditorRef,
  onNoteInput,
  onSave,
  isSaving,
  isSubmitting,
  t,
}: LogFormJournalPageProps) {
  const handleSave = () => {
    if (isSaving) return
    onSave()
  }

  return (
    <div className="log-form-carousel__reflection-land">
      <div className="log-form-carousel__reflection-cluster">
        <div className="log-reflection-card log-reflection-block log-reflection-block--journal">
          <header className="log-reflection-header">
            <div className={classNames('log-reflection-icon', 'log-reflection-icon--journal')} aria-hidden="true">
              <NotebookPen size={28} strokeWidth={2} />
            </div>
            <h2 className="log-reflection-title">{t('log.journalNotesTitle')}</h2>
            <p className="log-reflection-subtitle">{t('log.journalPageSubtitle')}</p>
          </header>

          <div className="log-reflection-section log-reflection-diary">
            <div className="log-diary-surface">
              <div className="log-diary-rules" aria-hidden="true">
                {Array.from({ length: JOURNAL_RULE_COUNT }).map((_, index) => (
                  <span key={`rule-${index}`} className="log-diary-rule" />
                ))}
              </div>
              <div
                ref={setNoteEditorRef}
                className="log-diary-editor"
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-multiline="true"
                data-empty={note.length === 0}
                data-placeholder={t('log.journalThoughtsPlaceholder')}
                aria-label={`${t('log.sectionThoughts')} (${t('log.optionalShort')})`}
                onInput={onNoteInput}
              />
            </div>
            <div className="log-diary-footer">
              <span>{t('log.characterCount', { count: note.length })}</span>
            </div>
          </div>
        </div>
        <motion.div className="log-form-carousel__actions log-form-carousel__actions--reflection-tight">
          <button
            type="button"
            className="save-button log-form-carousel__primary log-form-carousel__primary--block"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSubmitting ? t('log.saving') : t('log.carouselDone')}
            {isSubmitting && <span className="spinner log-form-carousel__saving-spinner" aria-hidden="true" />}
          </button>
        </motion.div>
      </div>
    </div>
  )
}
