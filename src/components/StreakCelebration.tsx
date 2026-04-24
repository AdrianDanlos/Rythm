import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type StreakCelebrationProps = {
  streakDays: number
  isVisible: boolean
  onComplete?: () => void
  onDismiss?: () => void
}

export const StreakCelebration = ({
  streakDays,
  isVisible,
  onComplete,
  onDismiss,
}: StreakCelebrationProps) => {
  const { t } = useTranslation()
  const hasTriggeredConfetti = useRef(false)

  function triggerConfetti() {
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) {
        window.clearInterval(interval)
        return
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      })
    }, 250)
  }

  useEffect(() => {
    if (isVisible && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true
      triggerConfetti()

      if (onComplete) {
        const timer = window.setTimeout(onComplete, 4000)
        return () => window.clearTimeout(timer)
      }
    }

    if (!isVisible) {
      hasTriggeredConfetti.current = false
    }
  }, [isVisible, onComplete])

  return (
    <AnimatePresence>
      {isVisible
        ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-backdrop"
              style={{ zIndex: 60, backdropFilter: 'blur(6px)' }}
              role="presentation"
              onClick={onDismiss}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 10 }}
                transition={{ type: 'spring', damping: 16, stiffness: 320 }}
                className="modal-card"
                style={{
                  width: 'min(520px, 100%)',
                  position: 'relative',
                  overflow: 'visible',
                  textAlign: 'center',
                  padding: 28,
                }}
                role="dialog"
                aria-modal="true"
                aria-label={t('streak.celebrationAria')}
                onClick={event => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="ghost icon-button"
                  onClick={onDismiss}
                  aria-label={t('common.close')}
                  style={{ position: 'absolute', top: 12, right: 12 }}
                >
                  ×
                </button>

                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                  transition={{
                    rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                    scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                  }}
                  style={{
                    position: 'absolute',
                    top: -18,
                    left: -18,
                    color: '#facc15',
                  }}
                  aria-hidden="true"
                >
                  <Sparkles size={30} />
                </motion.div>

                <motion.div
                  animate={{ rotate: -360, scale: [1, 1.3, 1] }}
                  transition={{
                    rotate: { duration: 15, repeat: Infinity, ease: 'linear' },
                    scale: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
                  }}
                  style={{
                    position: 'absolute',
                    top: -10,
                    right: -18,
                    color: '#fb923c',
                  }}
                  aria-hidden="true"
                >
                  <Sparkles size={26} />
                </motion.div>

                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, type: 'spring', damping: 10, stiffness: 220 }}
                  style={{ marginBottom: 14, position: 'relative' }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute',
                      inset: -18,
                      borderRadius: 999,
                      background:
                        'radial-gradient(circle at 35% 30%, rgba(253,186,116,0.95), rgba(249,115,22,0.7), rgba(194,65,12,0.28))',
                      filter: 'blur(22px)',
                      opacity: 0.28,
                      pointerEvents: 'none',
                    }}
                    aria-hidden="true"
                  />
                  <Trophy
                    size={76}
                    strokeWidth={1.5}
                    style={{
                      position: 'relative',
                      color: '#fbbf24',
                    }}
                  />
                </motion.div>

                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: 'spring', damping: 12 }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 8,
                  }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.1 }}
                    aria-hidden="true"
                  >
                    <svg
                      width="56"
                      height="56"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <defs>
                        <linearGradient id="streakGradient" x1="0" y1="24" x2="24" y2="0">
                          <stop offset="0%" stopColor="#fde047" />
                          <stop offset="55%" stopColor="#fb923c" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"
                        fill="url(#streakGradient)"
                      />
                    </svg>
                  </motion.div>

                  <motion.span
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      fontSize: 72,
                      fontWeight: 900,
                      lineHeight: 1,
                      background: 'linear-gradient(135deg, #fde047, #fb923c, #ec4899)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    {streakDays}
                  </motion.span>
                </motion.div>

                <motion.div
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.45 }}
                >
                  <h2 style={{ fontSize: '1.9rem', marginBottom: 6 }}>
                    {t('streak.celebrationTitle')}
                  </h2>
                  <p className="muted" style={{ fontSize: '1.05rem' }}>
                    {t('streak.celebrationBody', { count: streakDays })}
                  </p>
                </motion.div>

                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.9, opacity: 0.6 }}
                    animate={{ scale: [0.9, 2], opacity: [0.42, 0] }}
                    transition={{
                      duration: 2,
                      delay: i * 0.35,
                      repeat: Infinity,
                      ease: 'easeOut',
                    }}
                    style={{
                      position: 'absolute',
                      width: 220,
                      height: 220,
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -55%)',
                      borderRadius: 999,
                      border: '4px solid rgba(250, 204, 21, 0.75)',
                      pointerEvents: 'none',
                    }}
                    aria-hidden="true"
                  />
                ))}
              </motion.div>
            </motion.div>
          )
        : null}
    </AnimatePresence>
  )
}
