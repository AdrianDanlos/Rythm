import { CreditCard, LogOut, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AppBrand } from './AppBrand'
import { Tooltip } from './Tooltip'

type AppHeaderProps = {
  session: { user: { email?: string } } | null
  canManageSubscription: boolean
  isPortalLoading: boolean
  isSignOutLoading: boolean
  onOpenSettings: () => void
  onManageSubscription: () => void
  onSignOut: () => void
}

export function AppHeader({
  session,
  canManageSubscription,
  isPortalLoading,
  isSignOutLoading,
  onOpenSettings,
  onManageSubscription,
  onSignOut,
}: AppHeaderProps) {
  const { t } = useTranslation()
  return (
    <header className="app-header">
      <AppBrand />
      <div className="header-actions">
        {session
          ? (
              <>
                <Tooltip label={t('nav.settings')}>
                  <button
                    className="ghost icon-button"
                    type="button"
                    onClick={onOpenSettings}
                    aria-label={t('nav.settings')}
                  >
                    <Settings className="icon" aria-hidden="true" />
                  </button>
                </Tooltip>

                {canManageSubscription
                  ? (
                      <Tooltip label={t('nav.manageSubscription')}>
                        <button
                          className="ghost icon-button"
                          type="button"
                          onClick={onManageSubscription}
                          aria-label={t('nav.manageSubscription')}
                          disabled={isPortalLoading}
                        >
                          <CreditCard className="icon" aria-hidden="true" />
                        </button>
                      </Tooltip>
                    )
                  : null}

                <Tooltip label={t('nav.signOut')}>
                  <button
                    className="ghost icon-button"
                    onClick={onSignOut}
                    type="button"
                    aria-label={isSignOutLoading ? t('nav.signingOut') : t('nav.signOut')}
                    aria-busy={isSignOutLoading}
                    disabled={isSignOutLoading}
                  >
                    {isSignOutLoading
                      ? (
                          <span className="spinner" aria-hidden="true" />
                        )
                      : (
                          <LogOut className="icon" aria-hidden="true" />
                        )}
                  </button>
                </Tooltip>
              </>
            )
          : null}
      </div>
    </header>
  )
}
