import { useRef, type MouseEvent, type TouchEvent } from 'react'
import { CLOSE_TRANSIENT_PANELS_EVENT } from '../lib/appEvents'

type Params = {
  lockNonLogTabs: boolean
  isMenuPanelOpen: boolean
  setIsMenuPanelOpen: React.Dispatch<React.SetStateAction<boolean>>
}

/**
 * Edge swipe to open side menu and outside-click to close (coordinates with transient UI via event).
 */
export function useAppMenuPanelGestures({
  lockNonLogTabs,
  isMenuPanelOpen,
  setIsMenuPanelOpen,
}: Params) {
  const swipeStartXRef = useRef<number | null>(null)

  const shouldIgnoreMenuSwipe = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false
    return Boolean(
      target.closest(
        '.timeline-filter-sheet, input, textarea, select, button, [role="slider"]',
      ),
    )
  }

  const handleSwipeStart = (event: TouchEvent<HTMLDivElement>) => {
    if (lockNonLogTabs) {
      swipeStartXRef.current = null
      return
    }
    if (shouldIgnoreMenuSwipe(event.target)) {
      swipeStartXRef.current = null
      return
    }
    const touch = event.touches[0]
    // Only start a swipe if it begins near the left edge to avoid conflicts
    swipeStartXRef.current = touch.clientX <= 32 ? touch.clientX : null
  }

  const handleSwipeMove = (event: TouchEvent<HTMLDivElement>) => {
    if (lockNonLogTabs) return
    if (shouldIgnoreMenuSwipe(event.target)) return
    if (swipeStartXRef.current == null || isMenuPanelOpen) return
    const touch = event.touches[0]
    const deltaX = touch.clientX - swipeStartXRef.current
    // Simple threshold: a rightward swipe of at least 40px from the edge opens the menu
    if (deltaX > 40) {
      swipeStartXRef.current = null
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(CLOSE_TRANSIENT_PANELS_EVENT))
      }
      setIsMenuPanelOpen(true)
    }
  }

  const handleSwipeEnd = () => {
    swipeStartXRef.current = null
  }

  const handleAppClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!isMenuPanelOpen) return

    const target = event.target as HTMLElement | null
    if (!target) return

    if (target.closest('.side-panel') || target.closest('.app-header-menu-btn')) {
      return
    }

    setIsMenuPanelOpen(false)
  }

  return {
    handleSwipeStart,
    handleSwipeMove,
    handleSwipeEnd,
    handleAppClick,
  }
}
