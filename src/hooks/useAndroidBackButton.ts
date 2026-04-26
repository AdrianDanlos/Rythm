import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { AppPage } from '../lib/appTabs'

type Params = {
  isNativeApp: boolean
  isFeedbackOpen: boolean
  closeFeedback: () => void
  isReviewPromptOpen: boolean
  closeReviewPrompt: () => void
  activePage: AppPage
  closePaywall: () => void
  isStreakOpen: boolean
  closeStreak: () => void
  canGoBackInApp: boolean
  runSaveBeforeLeavingTab: () => void
  goBackInApp: () => boolean
}

/**
 * Android hardware back: close modals/paywall first, then in-app history, else exit.
 */
export function useAndroidBackButton({
  isNativeApp,
  isFeedbackOpen,
  closeFeedback,
  isReviewPromptOpen,
  closeReviewPrompt,
  activePage,
  closePaywall,
  isStreakOpen,
  closeStreak,
  canGoBackInApp,
  runSaveBeforeLeavingTab,
  goBackInApp,
}: Params): void {
  useEffect(() => {
    if (!isNativeApp || Capacitor.getPlatform() !== 'android') return

    const listenerPromise = CapacitorApp.addListener('backButton', () => {
      if (isFeedbackOpen) {
        closeFeedback()
        return
      }
      if (isReviewPromptOpen) {
        closeReviewPrompt()
        return
      }
      if (activePage === AppPage.Pro) {
        closePaywall()
        return
      }
      if (isStreakOpen) {
        closeStreak()
        return
      }

      if (canGoBackInApp) {
        runSaveBeforeLeavingTab()
        if (goBackInApp()) {
          return
        }
      }

      CapacitorApp.exitApp()
    })

    return () => {
      void listenerPromise.then(listener => listener.remove())
    }
  }, [
    isNativeApp,
    isFeedbackOpen,
    isReviewPromptOpen,
    isStreakOpen,
    activePage,
    closeFeedback,
    closeReviewPrompt,
    closePaywall,
    closeStreak,
    canGoBackInApp,
    runSaveBeforeLeavingTab,
    goBackInApp,
  ])
}
