import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AppPage } from '../lib/appTabs'
import {
  dismissDailyReminderNudge,
  shouldShowDailyReminderNudge,
} from '../lib/notifications'
import { requestScrollToSettingsReminder } from './useScrollToSettingsReminderOnMount'

type NavigateToPage = (page: AppPage, options?: { replace?: boolean }) => void

/**
 * Post-save flow: optional daily-reminder nudge toast after the user completes their first week of logging (3 entries),
 * plus suppression of the default “saved” toast when that nudge is active.
 */
export function useDailyReminderPostSave(
  navigateToPage: NavigateToPage,
  goToInsightsSummary: () => void,
) {
  const { t } = useTranslation()

  const handleEnableReminderNudge = useCallback(() => {
    dismissDailyReminderNudge()
    requestScrollToSettingsReminder()
    navigateToPage(AppPage.Settings)
  }, [navigateToPage])

  const handleEntrySavedForToday = useCallback((entryCount: number) => {
    goToInsightsSummary()
    if (entryCount !== 3) {
      return
    }
    if (!shouldShowDailyReminderNudge()) {
      return
    }

    toast(t('notifications.nudgeTitle'), {
      description: t('notifications.nudgeBody'),
      duration: Number.POSITIVE_INFINITY,
      dismissible: true,
      closeButton: true,
      action: {
        label: t('notifications.nudgeEnableAction'),
        onClick: () => {
          void handleEnableReminderNudge()
        },
      },
      onDismiss: () => dismissDailyReminderNudge(),
    })
  }, [goToInsightsSummary, handleEnableReminderNudge, t])

  const shouldSuppressPostSaveToast = useCallback(
    (entryCount: number) => entryCount === 3 && shouldShowDailyReminderNudge(),
    [],
  )

  return { handleEntrySavedForToday, shouldSuppressPostSaveToast }
}
