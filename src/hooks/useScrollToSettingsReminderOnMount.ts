import { useEffect, type RefObject } from 'react'
import { SESSION_STORAGE_KEYS } from '../lib/storageKeys'

/** Call before navigating to Settings so reminder controls are brought into view. */
export function requestScrollToSettingsReminder() {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(SESSION_STORAGE_KEYS.SCROLL_TO_SETTINGS_REMINDER, '1')
  }
}

export function useScrollToSettingsReminderOnMount(targetRef: RefObject<Element | null>) {
  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return
    if (sessionStorage.getItem(SESSION_STORAGE_KEYS.SCROLL_TO_SETTINGS_REMINDER) !== '1') return
    sessionStorage.removeItem(SESSION_STORAGE_KEYS.SCROLL_TO_SETTINGS_REMINDER)

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
      const toggle = el.querySelector<HTMLInputElement>('#settings-reminder')
      toggle?.focus()
    }

    requestAnimationFrame(() => requestAnimationFrame(scrollToTarget))
  }, [targetRef])
}
