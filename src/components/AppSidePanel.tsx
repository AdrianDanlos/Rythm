import {
  CreditCard,
  HandCoins,
  FileDown,
  FileText,
  Link2,
  LogOut,
  MessageSquare,
  Settings,
  Sparkles,
  Star,
} from 'lucide-react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'

type AppSidePanelProps = {
  isOpen: boolean
  onClose: () => void
  session: { user: { email?: string, is_anonymous?: boolean } } | null
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
  onOpenKoFi: () => void
  onSignOut: () => void
  onSaveAccountWithGoogle: () => void
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
      className={classNames('side-panel__item', className)}
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

function PanelSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="side-panel__section" aria-label={title}>
      <h3 className="side-panel__section-title">{title}</h3>
      <div className="side-panel__section-items">{children}</div>
    </section>
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
    onOpenKoFi,
    onSignOut,
    onSaveAccountWithGoogle,
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
        className={classNames('side-panel', { 'side-panel--open': isOpen })}
        aria-modal="true"
        aria-label={t('nav.menu')}
        aria-hidden={!isOpen}
      >
        <nav className="side-panel__nav">
          <PanelSection title={t('nav.menuDataSection')}>
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
          </PanelSection>

          <PanelSection title={t('nav.menuSupportSection')}>
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
            <PanelButton
              icon={HandCoins}
              label={t('insights.donate')}
              onClick={() => runAndClose(onOpenKoFi)}
            />
          </PanelSection>

          <PanelSection title={t('nav.menuAccountSection')}>
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
            {session?.user?.is_anonymous && (
              <PanelButton
                icon={Link2}
                label={t('auth.saveAccountWithGoogle')}
                onClick={() => runAndClose(onSaveAccountWithGoogle)}
              />
            )}
            {session && (
              <PanelButton
                icon={LogOut}
                label={t('nav.signOut')}
                onClick={() => runAndClose(onSignOut)}
                disabled={isSignOutLoading}
              />
            )}
          </PanelSection>
        </nav>
      </aside>
    </>
  )
}
