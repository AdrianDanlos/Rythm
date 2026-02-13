import { CreditCard, LogOut, Settings } from 'lucide-react'
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
  return (
    <header className="app-header">
      <AppBrand />
      <div className="header-actions">
        {session
          ? (
              <>
                <Tooltip label="Settings">
                  <button
                    className="ghost icon-button"
                    type="button"
                    onClick={onOpenSettings}
                    aria-label="Settings"
                  >
                    <Settings className="icon" aria-hidden="true" />
                  </button>
                </Tooltip>

                {canManageSubscription
                  ? (
                      <Tooltip label="Manage subscription">
                        <button
                          className="ghost icon-button"
                          type="button"
                          onClick={onManageSubscription}
                          aria-label="Manage subscription"
                          disabled={isPortalLoading}
                        >
                          <CreditCard className="icon" aria-hidden="true" />
                        </button>
                      </Tooltip>
                    )
                  : null}

                <Tooltip label="Sign out">
                  <button
                    className="ghost icon-button"
                    onClick={onSignOut}
                    type="button"
                    aria-label={isSignOutLoading ? 'Signing out' : 'Sign out'}
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
