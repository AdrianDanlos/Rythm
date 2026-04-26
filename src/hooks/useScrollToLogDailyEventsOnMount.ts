import { useEffect, type RefObject } from 'react'
import { SESSION_STORAGE_KEYS } from '../lib/storageKeys'

/**
 * If we should open the log form on the events/journal step (e.g. after "Log today"),
 * the scroll hook reads sessionStorage. Use the same read for initial carousel page
 * *before* first render so the tag field exists when the scroll effect runs.
 */
export function getInitialLogCarouselPageFromSession(): 0 | 1 | 2 | 3 {
  if (typeof sessionStorage === 'undefined') return 0
  if (sessionStorage.getItem(SESSION_STORAGE_KEYS.SCROLL_TO_LOG_DAILY_EVENTS) === '1') {
    return 2
  }
  return 0
}

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
