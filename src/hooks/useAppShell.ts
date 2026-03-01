import { useState, useCallback } from 'react'
import { AppPage, Tabs, type TabKey } from '../lib/appTabs'

type UseAppShellParams = {
  activeTab: TabKey
  onNavigateToPage: (page: AppPage, options?: { replace?: boolean }) => void
}

export function useAppShell({ activeTab, onNavigateToPage }: UseAppShellParams) {
  const [isStreakOpen, setIsStreakOpen] = useState(false)
  const [isPaywallOpen, setIsPaywallOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const saveLogWhenLeaving = useCallback((handleSave: () => void) => {
    if (activeTab === Tabs.Log) {
      handleSave()
    }
  }, [activeTab])

  return {
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
      onNavigateToPage(AppPage.Summary)
    },
  }
}
