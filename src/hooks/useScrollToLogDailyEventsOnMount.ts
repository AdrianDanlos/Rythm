import { useEffect, type RefObject } from 'react'
import { SESSION_STORAGE_KEYS } from '../lib/storageKeys'

/** Call before navigating to Log so the form scrolls to the daily-events field after mount. */
export function requestScrollToLogDailyEventsInput() {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(SESSION_STORAGE_KEYS.SCROLL_TO_LOG_DAILY_EVENTS, '1')
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
