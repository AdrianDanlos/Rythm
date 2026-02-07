import { useRef, useState, useLayoutEffect, useCallback, useEffect, type ReactNode } from 'react'

const PADDING = 8

const isTouchDevice = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

type TooltipProps = {
  label: string
  children: ReactNode
  className?: string
}

export const Tooltip = ({ label, children, className }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isTouch, setIsTouch] = useState(false)
  const [bubbleStyle, setBubbleStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    left: 0,
    top: 0,
    visibility: 'hidden',
  })
  const triggerRef = useRef<HTMLSpanElement>(null)
  const bubbleRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    setIsTouch(isTouchDevice())
  }, [])

  const hide = useCallback(() => setIsVisible(false), [])

  // On mobile, dismiss tooltip when the user scrolls
  useEffect(() => {
    if (!isVisible || !isTouch) return
    const onScroll = () => hide()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isVisible, isTouch, hide])

  // On mobile, open/close by tap; after scroll-hide we don't get mouseEnter again so click must reopen
  const handleTriggerClick = useCallback(() => {
    if (!isTouch) return
    setIsVisible(v => !v)
  }, [isTouch])

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    const bubble = bubbleRef.current
    if (!trigger || !bubble) return

    const app = document.querySelector('.app')
    const appRect = app?.getBoundingClientRect() ?? {
      left: PADDING,
      top: PADDING,
      right: window.innerWidth - PADDING,
      bottom: window.innerHeight - PADDING,
    }

    const triggerRect = trigger.getBoundingClientRect()
    const bubbleRect = bubble.getBoundingClientRect()

    // Prefer above, flip to below if not enough space
    let top: number
    const spaceAbove = triggerRect.top - appRect.top
    const spaceBelow = appRect.bottom - triggerRect.bottom
    if (spaceAbove >= bubbleRect.height + PADDING || spaceAbove >= spaceBelow) {
      top = triggerRect.top - bubbleRect.height - PADDING
    } else {
      top = triggerRect.bottom + PADDING
    }

    // Center horizontally, clamped to app
    let left = triggerRect.left + triggerRect.width / 2 - bubbleRect.width / 2
    left = Math.max(appRect.left + PADDING, Math.min(appRect.right - bubbleRect.width - PADDING, left))
    top = Math.max(appRect.top + PADDING, Math.min(appRect.bottom - bubbleRect.height - PADDING, top))

    setBubbleStyle({
      position: 'fixed',
      left,
      top,
      visibility: 'visible',
      opacity: 1,
      transform: 'none',
    })
  }, [])

  useLayoutEffect(() => {
    if (!isVisible) return
    updatePosition()
  }, [isVisible, updatePosition])

  const show = useCallback(() => setIsVisible(true), [])

  return (
    <span
      ref={triggerRef}
      className={['app-tooltip', 'app-tooltip--positioned', className].filter(Boolean).join(' ')}
      onMouseEnter={!isTouch ? show : undefined}
      onMouseLeave={!isTouch ? hide : undefined}
      onFocusCapture={!isTouch ? show : undefined}
      onBlurCapture={!isTouch ? hide : undefined}
      onClick={handleTriggerClick}
    >
      {children}
      {isVisible && (
        <span
          ref={bubbleRef}
          className="app-tooltip-bubble"
          role="tooltip"
          style={bubbleStyle}
        >
          {label}
        </span>
      )}
    </span>
  )
}
