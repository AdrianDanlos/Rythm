import { useEffect, type RefObject } from 'react'
import { SESSION_STORAGE_KEYS } from '../lib/storageKeys'

/**
 * One-shot initial carousel page from sessionStorage: daily-events step, mood step, or 0.
 * (Read in LogForm’s initial state so, e.g., the events tag field exists for the scroll effect.)
 */
export function getInitialLogCarouselPageFromSession(): 0 | 1 | 2 | 3 {
  if (typeof sessionStorage === 'undefined') return 0
  if (sessionStorage.getItem(SESSION_STORAGE_KEYS.SCROLL_TO_LOG_DAILY_EVENTS) === '1') {
    return 2
  }
  if (sessionStorage.getItem(SESSION_STORAGE_KEYS.OPEN_LOG_CAROUSEL_AT_MOOD) === '1') {
    sessionStorage.removeItem(SESSION_STORAGE_KEYS.OPEN_LOG_CAROUSEL_AT_MOOD)
    return 1
  }
  return 0
}

/** Call before navigating to Log so the form scrolls to the daily-events field after mount. */
export function requestScrollToLogDailyEventsInput() {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(SESSION_STORAGE_KEYS.SCROLL_TO_LOG_DAILY_EVENTS, '1')
  }
}

/** Open the log on the mood carousel step (page 1) on next Log mount, e.g. sleep logged but mood missing. */
export function requestOpenLogCarouselAtMood() {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(SESSION_STORAGE_KEYS.OPEN_LOG_CAROUSEL_AT_MOOD, '1')
  }
}

export function useScrollToLogDailyEventsOnMount(
  targetRef: RefObject<Element | null>,
  onAfterScroll?: (el: HTMLElement) => void,
) {
  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return
    if (sessionStorage.getItem(SESSION_STORAGE_KEYS.SCROLL_TO_LOG_DAILY_EVENTS) !== '1') return
    sessionStorage.removeItem(SESSION_STORAGE_KEYS.SCROLL_TO_LOG_DAILY_EVENTS)
    const scrollToTarget = () => {
      const el = targetRef.current
      if (!el || !(el instanceof HTMLElement)) return
      const prefersReducedMotion
        = typeof window !== 'undefined'
          && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'center',
      })
      requestAnimationFrame(() => onAfterScroll?.(el))
    }
    requestAnimationFrame(() => requestAnimationFrame(scrollToTarget))
  }, [targetRef, onAfterScroll])
}
