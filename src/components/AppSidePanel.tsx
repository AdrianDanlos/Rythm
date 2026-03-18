import {
  CreditCard,
  FileDown,
  FileText,
  LogOut,
  MessageSquare,
  Settings,
  Sparkles,
  Star,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

type AppSidePanelProps = {
  isOpen: boolean
  onClose: () => void
  session: { user: { email?: string } } | null
  isPro: boolean
  canManageSubscription: boolean
  isSignOutLoading: boolean
  onExportCsv: () => void
  onExportReport: () => void
  onOpenSettings: () => void
  onOpenPaywall: () => void
  onManageSubscription: () => void
  onReviewApp: () => void
  onOpenFeedback: () => void
  onSignOut: () => void
}

function PanelButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  className,
  afterLabel,
}: {
  icon: React.ComponentType<{ 'className'?: string, 'aria-hidden'?: boolean }>
  label: string
  onClick: () => void
  disabled?: boolean
  className?: string
  afterLabel?: React.ReactNode
}) {
  return (
    <button
      type="button"
      className={['side-panel__item', className].filter(Boolean).join(' ')}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="side-panel__icon" aria-hidden={true} />
      <span className="side-panel__item-label">
        {label}
        {afterLabel}
      </span>
    </button>
  )
}

export function AppSidePanel(props: AppSidePanelProps) {
  const {
    isOpen,
    onClose,
    session,
    isPro,
    canManageSubscription,
    isSignOutLoading,
    onExportCsv,
    onExportReport,
    onOpenSettings,
    onOpenPaywall,
    onManageSubscription,
    onReviewApp,
    onOpenFeedback,
    onSignOut,
  } = props
  const { t } = useTranslation()
  const runAndClose = (fn: () => void) => {
    fn()
    onClose()
  }

  return (
    <>
      {isOpen && (
        <div
          className="side-panel-backdrop"
          role="presentation"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`side-panel${isOpen ? ' side-panel--open' : ''}`}
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!isOpen}
      >
        <nav className="side-panel__nav">
          <PanelButton
            icon={FileDown}
            label={t('insights.exportCsv')}
            onClick={() => runAndClose(onExportCsv)}
          />
          <PanelButton
            icon={FileText}
            label={t('insights.exportReport')}
            className={!isPro ? 'pro-locked-button' : undefined}
            afterLabel={
              !isPro
                ? <span className="pro-pill">{t('insights.pro')}</span>
                : undefined
            }
            onClick={() =>
              runAndClose(!isPro ? onOpenPaywall : onExportReport)}
          />
          <PanelButton
            icon={Settings}
            label={t('nav.settings')}
            onClick={() => runAndClose(onOpenSettings)}
          />
          {!isPro && (
            <PanelButton
              icon={Sparkles}
              label={t('insights.upgradeToPro')}
              onClick={() => runAndClose(onOpenPaywall)}
            />
          )}
          {canManageSubscription && (
            <PanelButton
              icon={CreditCard}
              label={t('nav.manageSubscription')}
              onClick={() => runAndClose(onManageSubscription)}
            />
          )}
          <PanelButton
            icon={Star}
            label={t('insights.rateOnGooglePlay')}
            onClick={() => runAndClose(onReviewApp)}
          />
          <PanelButton
            icon={MessageSquare}
            label={t('insights.sendFeedback')}
            onClick={() => runAndClose(onOpenFeedback)}
          />
          {session && (
            <PanelButton
              icon={LogOut}
              label={t('nav.signOut')}
              onClick={() => runAndClose(onSignOut)}
              disabled={isSignOutLoading}
            />
          )}
        </nav>
      </aside>
    </>
  )
}
