import { useRef, useState, useLayoutEffect, useCallback, type ReactNode } from 'react'

const PADDING = 8

type TooltipProps = {
  label: string
  children: ReactNode
  className?: string
}

export const Tooltip = ({ label, children, className }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [bubbleStyle, setBubbleStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    left: 0,
    top: 0,
    visibility: 'hidden',
  })
  const triggerRef = useRef<HTMLSpanElement>(null)
  const bubbleRef = useRef<HTMLSpanElement>(null)

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
  const hide = useCallback(() => setIsVisible(false), [])

  return (
    <span
      ref={triggerRef}
      className={['app-tooltip', 'app-tooltip--positioned', className].filter(Boolean).join(' ')}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={show}
      onBlurCapture={hide}
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
