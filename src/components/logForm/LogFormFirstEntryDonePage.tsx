import { motion, useReducedMotion } from 'framer-motion'
import { PartyPopper } from 'lucide-react'
import type { TFunction } from 'i18next'
import { motionTransition, motionTransitionSlow } from '../../lib/motion'

type LogFormFirstEntryDonePageProps = {
  onContinue: () => void
  t: TFunction
}

export function LogFormFirstEntryDonePage({ onContinue, t }: LogFormFirstEntryDonePageProps) {
  const reduceMotion = useReducedMotion()
  const motionOn = !reduceMotion

  return (
    <div className="log-form-carousel__reflection-land">
      <div className="log-form-carousel__reflection-cluster">
        <motion.div
          className="log-reflection-card log-reflection-block log-reflection-block--first-entry-done"
          role="status"
          initial={motionOn ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={motionOn ? motionTransitionSlow : { duration: 0 }}
        >
          <div className="log-first-entry-done__head">
            <motion.div
              className="log-reflection-icon log-reflection-icon--first-entry-done"
              aria-hidden="true"
              initial={motionOn ? { opacity: 0, scale: 0.92 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={
                motionOn
                  ? {
                      type: 'spring',
                      stiffness: 420,
                      damping: 28,
                      mass: 0.85,
                    }
                  : { duration: 0 }
              }
            >
              <PartyPopper size={28} strokeWidth={2} />
            </motion.div>
            <motion.p
              className="log-first-entry-done__body"
              initial={motionOn ? { opacity: 0, y: 6 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={
                motionOn ? { ...motionTransition, delay: 0.06 } : { duration: 0 }
              }
            >
              {t('log.firstEntryComplete')}
            </motion.p>
          </div>
        </motion.div>
        <motion.div
          className="log-form-carousel__actions log-form-carousel__actions--reflection-tight"
          initial={motionOn ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={
            motionOn ? { ...motionTransition, delay: 0.14 } : { duration: 0 }
          }
        >
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
