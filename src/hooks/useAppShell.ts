import { useState, useCallback } from 'react'
import { STORAGE_KEYS } from '../lib/storageKeys'
import { Tabs, type TabKey, type InsightsSection } from '../lib/appTabs'

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

  const saveLogWhenLeaving = useCallback((handleSave: () => void) => {
    if (activeTab === Tabs.Log) {
      handleSave()
    }
  }, [activeTab])

  return {
    activeTab,
    setActiveTab,
    activeInsightsTab,
    setActiveInsightsTab,
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
      setActiveTab(Tabs.Insights)
      setActiveInsightsTab(Tabs.Summary)
    },
  }
}
