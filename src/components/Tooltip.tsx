import type { ReactNode } from 'react'

type TooltipProps = {
  label: string
  children: ReactNode
  className?: string
}

export const Tooltip = ({ label, children, className }: TooltipProps) => (
  <span className={['app-tooltip', className].filter(Boolean).join(' ')}>
    {children}
    <span className="app-tooltip-bubble" role="tooltip">
      {label}
    </span>
  </span>
)
