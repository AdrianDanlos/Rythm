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
import logo from '../assets/rythm-logo.png'
import logoBlack from '../assets/rythm-logo-black.png'

type AppSidePanelProps = {
  isOpen: boolean
  onClose: () => void
  session: { user: { email?: string } } | null
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
}: {
  icon: React.ComponentType<{ 'className'?: string, 'aria-hidden'?: boolean }>
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      className="side-panel__item"
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="side-panel__icon" aria-hidden={true} />
      <span>{label}</span>
    </button>
  )
}

export function AppSidePanel({
  isOpen,
  onClose,
  session,
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
}: AppSidePanelProps) {
  const { t } = useTranslation()

  const runAndClose = (fn: () => void) => {
    fn()
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="side-panel-backdrop"
        role="presentation"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="side-panel"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className="side-panel__header">
          <img className="side-panel__logo side-panel__logo--light" src={logoBlack} alt="" />
          <img className="side-panel__logo side-panel__logo--dark" src={logo} alt="" />
        </div>
        <nav className="side-panel__nav">
          <PanelButton
            icon={FileDown}
            label={t('insights.exportCsv')}
            onClick={() => runAndClose(onExportCsv)}
          />
          <PanelButton
            icon={FileText}
            label={t('insights.exportReport')}
            onClick={() => runAndClose(onExportReport)}
          />
          <PanelButton
            icon={Settings}
            label={t('nav.settings')}
            onClick={() => runAndClose(onOpenSettings)}
          />
          <PanelButton
            icon={Sparkles}
            label={t('insights.upgradeToPro')}
            onClick={() => runAndClose(onOpenPaywall)}
          />
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
