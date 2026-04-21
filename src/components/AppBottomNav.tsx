import { useRef } from 'react'
import classNames from 'classnames'
import { CreditCard, LogOut, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AppBrand } from './AppBrand'
import { Tooltip } from './Tooltip'
import { AppPage, Tabs, type TabKey, type InsightsSection } from '../lib/appTabs'

type AppBottomNavProps = {
  session: { user: { email?: string } } | null
  activePage: AppPage
  activeTab: TabKey
  activeInsightsTab: InsightsSection
  lockNonLogTabs: boolean
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
  activePage,
  activeTab,
  activeInsightsTab,
  lockNonLogTabs,
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
  const lastTouchNavAtMsRef = useRef(0)
  const showActiveStyles = activePage !== AppPage.Settings && activePage !== AppPage.Pro

  const handleTabInteraction = (navigate: () => void) => ({
    onTouchEnd: () => {
      lastTouchNavAtMsRef.current = Date.now()
      navigate()
    },
    onClick: () => {
      // Mobile browsers may fire a delayed synthetic click after touch.
      if (Date.now() - lastTouchNavAtMsRef.current < 500) {
        return
      }
      navigate()
    },
  })

  const goToSummary = () => {
    if (lockNonLogTabs) return
    onBeforeLeaveTab()
    onNavigateToPage(AppPage.Summary)
  }

  const goToCharts = () => {
    if (lockNonLogTabs) return
    onBeforeLeaveTab()
    onNavigateToPage(AppPage.Charts)
  }

  const goToEvents = () => {
    if (lockNonLogTabs) return
    onBeforeLeaveTab()
    onNavigateToPage(AppPage.Events)
  }

  const goToTimeline = () => {
    if (lockNonLogTabs) return
    onBeforeLeaveTab()
    onNavigateToPage(AppPage.Timeline)
  }

  const goToLog = () => onNavigateToPage(AppPage.Log)

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
                  className={classNames('tab-button', {
                    active:
                      showActiveStyles
                      && activeTab === Tabs.Insights
                      && activeInsightsTab === Tabs.Summary,
                  })}
                  {...handleTabInteraction(goToSummary)}
                  disabled={lockNonLogTabs}
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
                  className={classNames('tab-button', {
                    active:
                      showActiveStyles
                      && activeTab === Tabs.Insights
                      && activeInsightsTab === Tabs.Timeline,
                  })}
                  {...handleTabInteraction(goToTimeline)}
                  disabled={lockNonLogTabs}
                >
                  <span className="tab-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M7 2v4M17 2v4M3 10h18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="17"
                        rx="3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  </span>
                  <span>{t('nav.timeline')}</span>
                </button>
                <button
                  type="button"
                  className={classNames('tab-button', 'tab-button--log-fab', {
                    active: showActiveStyles && activeTab === Tabs.Log,
                  })}
                  {...handleTabInteraction(goToLog)}
                  aria-label={t('nav.log')}
                >
                  <span className="tab-fab-plus" aria-hidden="true">+</span>
                </button>
                <button
                  type="button"
                  className={classNames('tab-button', {
                    active:
                      showActiveStyles
                      && activeTab === Tabs.Insights
                      && activeInsightsTab === Tabs.Charts,
                  })}
                  {...handleTabInteraction(goToCharts)}
                  disabled={lockNonLogTabs}
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
                  className={classNames('tab-button', {
                    active:
                      showActiveStyles
                      && activeTab === Tabs.Insights
                      && activeInsightsTab === Tabs.Events,
                  })}
                  {...handleTabInteraction(goToEvents)}
                  disabled={lockNonLogTabs}
                >
                  <span className="tab-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M8 6h13M8 12h13M8 18h13"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <circle cx="4" cy="6" r="1.5" fill="currentColor" />
                      <circle cx="4" cy="12" r="1.5" fill="currentColor" />
                      <circle cx="4" cy="18" r="1.5" fill="currentColor" />
                    </svg>
                  </span>
                  <span>{t('nav.events')}</span>
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
