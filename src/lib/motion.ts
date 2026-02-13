import type { Transition } from 'framer-motion'

/** Short, minimal transitions for UI elements (e.g. tab switch) */
export const motionTransition: Transition = {
  duration: 0.15,
  ease: 'easeOut',
}

/** Slightly longer for progress / emphasis */
export const motionTransitionSlow: Transition = {
  duration: 0.4,
  ease: 'easeOut',
}

/** Card/section entrance */
export const cardEnter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: motionTransition,
}

/** Progress bar (animate width) */
export const progressEnter = {
  initial: { width: 0 },
  transition: motionTransitionSlow,
}
