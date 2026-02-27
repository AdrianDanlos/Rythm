import { useState, useCallback, useEffect, useRef } from 'react'
import { STORAGE_KEYS } from '../lib/storageKeys'
import {
  AppPage,
  Tabs,
  getAppPage,
  getInsightsSectionForPage,
  type TabKey,
  type InsightsSection,
} from '../lib/appTabs'

export function useAppShell() {
  const [activeTab, setActiveTab] = useState<TabKey>(() =>
    typeof window !== 'undefined' &&
    window.localStorage.getItem(STORAGE_KEYS.RETURNING_USER) === 'true'
      ? Tabs.Insights
      : Tabs.Log,
  )
  const [activeInsightsTab, setActiveInsightsTab] =
    useState<InsightsSection>(Tabs.Summary)
  const [isStreakOpen, setIsStreakOpen] = useState(false)
  const [isPaywallOpen, setIsPaywallOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const initialPage = getAppPage(activeTab, activeInsightsTab)
  const pageHistoryRef = useRef<AppPage[]>([initialPage])
  const suppressNextHistoryEntryRef = useRef(false)
  const [canGoBackInApp, setCanGoBackInApp] = useState(false)

  const saveLogWhenLeaving = useCallback((handleSave: () => void) => {
    if (activeTab === Tabs.Log) {
      handleSave()
    }
  }, [activeTab])

  const applyPage = useCallback((page: AppPage) => {
    if (page === AppPage.Log) {
      setActiveTab(Tabs.Log)
      return
    }

    setActiveTab(Tabs.Insights)
    setActiveInsightsTab(getInsightsSectionForPage(page))
  }, [])

  const recordPageVisit = useCallback((page: AppPage) => {
    const history = pageHistoryRef.current
    if (history[history.length - 1] === page) {
      return
    }
    pageHistoryRef.current = [...history, page]
    setCanGoBackInApp(pageHistoryRef.current.length > 1)
  }, [])

  const navigateToPage = useCallback((page: AppPage) => {
    applyPage(page)
  }, [applyPage])

  const goBackInApp = useCallback(() => {
    const history = pageHistoryRef.current
    if (history.length <= 1) {
      return false
    }

    const nextHistory = history.slice(0, -1)
    const targetPage = nextHistory[nextHistory.length - 1]
    if (!targetPage) {
      return false
    }

    pageHistoryRef.current = nextHistory
    setCanGoBackInApp(nextHistory.length > 1)
    suppressNextHistoryEntryRef.current = true
    applyPage(targetPage)
    return true
  }, [applyPage])

  useEffect(() => {
    const currentPage = getAppPage(activeTab, activeInsightsTab)
    if (suppressNextHistoryEntryRef.current) {
      suppressNextHistoryEntryRef.current = false
      return
    }
    recordPageVisit(currentPage)
  }, [activeTab, activeInsightsTab, recordPageVisit])

  return {
    activeTab,
    setActiveTab,
    activeInsightsTab,
    setActiveInsightsTab,
    navigateToPage,
    canGoBackInApp,
    goBackInApp,
    recordPageVisit,
    isStreakOpen,
    setIsStreakOpen,
    isPaywallOpen,
    setIsPaywallOpen,
    isFeedbackOpen,
    setIsFeedbackOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    saveLogWhenLeaving,
    openPaywall: () => setIsPaywallOpen(true),
    closeStreak: () => setIsStreakOpen(false),
    closePaywall: () => setIsPaywallOpen(false),
    openFeedback: () => setIsFeedbackOpen(true),
    closeFeedback: () => setIsFeedbackOpen(false),
    openSettings: () => setIsSettingsOpen(true),
    closeSettings: () => setIsSettingsOpen(false),
    goToInsightsSummary: () => {
      navigateToPage(AppPage.Summary)
    },
  }
}
