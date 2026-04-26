import { motion } from 'framer-motion'
import { PartyPopper } from 'lucide-react'
import type { TFunction } from 'i18next'

type LogFormFirstEntryDonePageProps = {
  onContinue: () => void
  t: TFunction
}

export function LogFormFirstEntryDonePage({ onContinue, t }: LogFormFirstEntryDonePageProps) {
  return (
    <div className="log-form-carousel__reflection-land">
      <div className="log-form-carousel__reflection-cluster">
        <div
          className="log-reflection-card log-reflection-block log-reflection-block--first-entry-done"
          role="status"
        >
          <div className="log-first-entry-done__head">
            <div className="log-reflection-icon log-reflection-icon--first-entry-done" aria-hidden="true">
              <PartyPopper size={28} strokeWidth={2} />
            </div>
            <p className="log-first-entry-done__body">
              {t('log.firstEntryComplete')}
            </p>
          </div>
        </div>
        <motion.div className="log-form-carousel__actions log-form-carousel__actions--reflection-tight">
          <button
            type="button"
            className="save-button log-form-carousel__primary log-form-carousel__primary--block"
            onClick={onContinue}
          >
            {t('log.firstEntryCompleteButton')}
          </button>
        </motion.div>
      </div>
    </div>
  )
}
