import { useState } from 'react'
import { AppPage } from '../lib/appTabs'

type UseAppShellParams = {
  onNavigateToPage: (page: AppPage, options?: { replace?: boolean }) => void
}

export function useAppShell({ onNavigateToPage }: UseAppShellParams) {
  const [isStreakOpen, setIsStreakOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)

  return {
    isStreakOpen,
    setIsStreakOpen,
    isFeedbackOpen,
    setIsFeedbackOpen,
    closeStreak: () => setIsStreakOpen(false),
    openFeedback: () => setIsFeedbackOpen(true),
    closeFeedback: () => setIsFeedbackOpen(false),
    goToInsightsSummary: () => {
      onNavigateToPage(AppPage.Summary)
    },
  }
}
