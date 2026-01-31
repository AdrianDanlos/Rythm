import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

const DAILY_REMINDER_ID = 1001
const DAILY_REMINDER_CHANNEL_ID = 'daily-reminder'
const DAILY_REMINDER_STORAGE_KEY = 'dailyReminderEnabled'

export const getStoredDailyReminderEnabled = () =>
  localStorage.getItem(DAILY_REMINDER_STORAGE_KEY) === 'true'

export const setStoredDailyReminderEnabled = (enabled: boolean) => {
  localStorage.setItem(DAILY_REMINDER_STORAGE_KEY, String(enabled))
}

const ensureAndroidChannel = async () => {
  if (Capacitor.getPlatform() !== 'android') return
  await LocalNotifications.createChannel({
    id: DAILY_REMINDER_CHANNEL_ID,
    name: 'Daily reminders',
    description: 'Daily logging reminders',
    importance: 3,
  })
}

export const scheduleDailyReminder = async ({
  hour = 20,
  minute = 0,
}: {
  hour?: number
  minute?: number
} = {}) => {
  if (!Capacitor.isNativePlatform()) return false

  const permission = await LocalNotifications.requestPermissions()
  if (permission.display !== 'granted') return false

  await ensureAndroidChannel()

  const pending = await LocalNotifications.getPending()
  const hasReminder = pending.notifications.some(
    notification => notification.id === DAILY_REMINDER_ID,
  )
  if (hasReminder) return true

  await LocalNotifications.schedule({
    notifications: [
      {
        id: DAILY_REMINDER_ID,
        title: 'Log your day',
        body: 'Add your sleep and mood to keep your streak going.',
        schedule: {
          on: { hour, minute },
          repeats: true,
          allowWhileIdle: true,
        },
        channelId: DAILY_REMINDER_CHANNEL_ID,
      },
    ],
  })

  return true
}

export const cancelDailyReminder = async () => {
  if (!Capacitor.isNativePlatform()) return
  await LocalNotifications.cancel({
    notifications: [{ id: DAILY_REMINDER_ID }],
  })
}
