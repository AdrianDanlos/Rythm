import { CreditCard, LogOut, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AppBrand } from './AppBrand'
import { Tooltip } from './Tooltip'
import { AppPage, Tabs, type TabKey, type InsightsSection } from '../lib/appTabs'

type AppBottomNavProps = {
  session: { user: { email?: string } } | null
  activeTab: TabKey
  activeInsightsTab: InsightsSection
  onNavigateToPage: (page: AppPage) => void
  onBeforeLeaveTab: () => void
  canManageSubscription: boolean
  isPortalLoading: boolean
  isSignOutLoading: boolean
  onOpenSettings: () => void
  onManageSubscription: () => void
  onSignOut: () => void
}

export function AppBottomNav({
  session,
  activeTab,
  activeInsightsTab,
  onNavigateToPage,
  onBeforeLeaveTab,
  canManageSubscription,
  isPortalLoading,
  isSignOutLoading,
  onOpenSettings,
  onManageSubscription,
  onSignOut,
}: AppBottomNavProps) {
  const { t } = useTranslation()
  return (
    <div className="insights-bottom-nav">
      <AppBrand className="nav-brand" />
      {session
        ? (
            <div className="nav-center">
              <div
                className="tabs insights-bottom-nav__tabs"
                role="tablist"
                aria-label={t('nav.insightsNavigation')}
              >
                <button
                  type="button"
                  className={`tab-button ${activeTab === Tabs.Insights && activeInsightsTab === Tabs.Summary ? 'active' : ''}`}
                  onClick={() => {
                    onBeforeLeaveTab()
                    onNavigateToPage(AppPage.Summary)
                  }}
                >
                  <span className="tab-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="16"
                        rx="3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M7 9h10M7 13h6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <span>{t('nav.summary')}</span>
                </button>
                <button
                  type="button"
                  className={`tab-button ${activeTab === Tabs.Insights && activeInsightsTab === Tabs.Charts ? 'active' : ''}`}
                  onClick={() => {
                    onBeforeLeaveTab()
                    onNavigateToPage(AppPage.Charts)
                  }}
                >
                  <span className="tab-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M4 18h16M6 16l4-6 4 3 4-7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="6" cy="16" r="1.5" fill="currentColor" />
                      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                      <circle cx="14" cy="13" r="1.5" fill="currentColor" />
                      <circle cx="18" cy="6" r="1.5" fill="currentColor" />
                    </svg>
                  </span>
                  <span>{t('nav.charts')}</span>
                </button>
                <button
                  type="button"
                  className={`tab-button ${activeTab === Tabs.Insights && activeInsightsTab === Tabs.Data ? 'active' : ''}`}
                  onClick={() => {
                    onBeforeLeaveTab()
                    onNavigateToPage(AppPage.Export)
                  }}
                >
                  <span className="tab-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <ellipse
                        cx="12"
                        cy="5.5"
                        rx="7"
                        ry="3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M5 5.5v6.5c0 1.9 3.1 3.5 7 3.5s7-1.6 7-3.5V5.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M5 12v6.5c0 1.9 3.1 3.5 7 3.5s7-1.6 7-3.5V12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  </span>
                  <span>{t('nav.export')}</span>
                </button>
                <button
                  type="button"
                  className={`tab-button ${activeTab === Tabs.Log ? 'active' : ''}`}
                  onClick={() => onNavigateToPage(AppPage.Log)}
                >
                  <span className="tab-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M12 5v14M5 12h14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <span>{t('nav.log')}</span>
                </button>
              </div>
              <div className="nav-actions" aria-label={t('nav.accountActions')}>
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
              </div>
            </div>
          )
        : null}
    </div>
  )
}
