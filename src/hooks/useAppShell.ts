import { useState, useCallback } from 'react'
import { AppPage, Tabs, type TabKey } from '../lib/appTabs'

type UseAppShellParams = {
  activeTab: TabKey
  onNavigateToPage: (page: AppPage, options?: { replace?: boolean }) => void
}

export function useAppShell({ activeTab, onNavigateToPage }: UseAppShellParams) {
  const [isStreakOpen, setIsStreakOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)

  const saveLogWhenLeaving = useCallback((handleSave: () => void) => {
    if (activeTab === Tabs.Log) {
      handleSave()
    }
  }, [activeTab])

  return {
    isStreakOpen,
    setIsStreakOpen,
    isFeedbackOpen,
    setIsFeedbackOpen,
    saveLogWhenLeaving,
    closeStreak: () => setIsStreakOpen(false),
    openFeedback: () => setIsFeedbackOpen(true),
    closeFeedback: () => setIsFeedbackOpen(false),
    goToInsightsSummary: () => {
      onNavigateToPage(AppPage.Summary)
    },
  }
}
