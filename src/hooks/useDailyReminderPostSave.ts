import { useCallback, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  dismissDailyReminderNudge,
  enableDailyReminderAtTime,
  getStoredDailyReminderTime,
  shouldShowDailyReminderNudge,
} from '../lib/notifications'

/**
 * Post-save flow: after the first entry of the day, optionally surface a
 * modal asking the user to enable the daily reminder. The modal handles the
 * permission flow directly — we never bounce the user to Settings as a nudge.
 */
export function useDailyReminderPostSave(goToInsightsSummary: () => void) {
  const { t } = useTranslation()
  const [isDailyReminderNudgeOpen, setIsDailyReminderNudgeOpen] = useState(false)

  const tryOpenDailyReminderNudge = useCallback(() => {
    if (!Capacitor.isNativePlatform()) return
    if (!shouldShowDailyReminderNudge()) return
    setIsDailyReminderNudgeOpen(true)
  }, [])

  const handleDismissDailyReminderNudge = useCallback(() => {
    dismissDailyReminderNudge()
    setIsDailyReminderNudgeOpen(false)
  }, [])

  const handleAllowDailyReminder = useCallback(async () => {
    let scheduled = false
    try {
      scheduled = await enableDailyReminderAtTime(getStoredDailyReminderTime())
    }
    catch {
      scheduled = false
    }
    dismissDailyReminderNudge()
    setIsDailyReminderNudgeOpen(false)
    if (scheduled) {
      toast.success(t('notifications.nudgeEnabled'))
    }
  }, [t])

  const handleEntrySavedForToday = useCallback((entryCount: number) => {
    if (entryCount === 1) {
      return
    }
    goToInsightsSummary()
  }, [goToInsightsSummary])

  return {
    handleEntrySavedForToday,
    isDailyReminderNudgeOpen,
    tryOpenDailyReminderNudge,
    handleAllowDailyReminder,
    handleDismissDailyReminderNudge,
  }
}
