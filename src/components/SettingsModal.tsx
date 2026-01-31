import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import {
  cancelDailyReminder,
  getStoredDailyReminderEnabled,
  getStoredDailyReminderTime,
  scheduleDailyReminder,
  setStoredDailyReminderEnabled,
  setStoredDailyReminderTime,
} from '../lib/notifications'
import type { DateFormatPreference, ThemePreference } from '../lib/settings'

type SettingsModalProps = {
  isOpen: boolean
  onClose: () => void
  name: string
  email: string
  dateFormat: DateFormatPreference
  theme: ThemePreference
  onNameChange: (value: string) => void
  onDateFormatChange: (value: DateFormatPreference) => void
  onThemeChange: (value: ThemePreference) => void
}

export const SettingsModal = ({
  isOpen,
  onClose,
  name,
  email,
  dateFormat,
  theme,
  onNameChange,
  onDateFormatChange,
  onThemeChange,
}: SettingsModalProps) => {
  const remindersSupported = Capacitor.isNativePlatform()
  const [remindersEnabled, setRemindersEnabled] = useState(
    () => getStoredDailyReminderEnabled(),
  )
  const [reminderTime, setReminderTime] = useState(
    () => getStoredDailyReminderTime(),
  )

  const parseReminderTime = (value: string) => {
    const [hourValue, minuteValue] = value.split(':')
    const hour = Number(hourValue)
    const minute = Number(minuteValue)
    if (
      !Number.isFinite(hour)
      || !Number.isFinite(minute)
      || hour < 0
      || hour > 23
      || minute < 0
      || minute > 59
    ) {
      return { hour: 20, minute: 0 }
    }
    return { hour, minute }
  }

  useEffect(() => {
    if (!remindersSupported || !remindersEnabled) return
    const { hour, minute } = parseReminderTime(reminderTime)
    void scheduleDailyReminder({ hour, minute })
  }, [reminderTime, remindersEnabled, remindersSupported])

  const handleReminderToggle = async (enabled: boolean) => {
    setRemindersEnabled(enabled)
    setStoredDailyReminderEnabled(enabled)

    if (!remindersSupported) return

    if (enabled) {
      const { hour, minute } = parseReminderTime(reminderTime)
      const scheduled = await scheduleDailyReminder({
        hour,
        minute,
        force: true,
      })
      if (!scheduled) {
        setRemindersEnabled(false)
        setStoredDailyReminderEnabled(false)
      }
      return
    }

    await cancelDailyReminder()
  }

  const handleReminderTimeChange = async (value: string) => {
    setReminderTime(value)
    setStoredDailyReminderTime(value)
    if (!remindersEnabled || !remindersSupported) return
    const { hour, minute } = parseReminderTime(value)
    await scheduleDailyReminder({ hour, minute, force: true })
  }

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={event => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="settings-title">Settings</h2>
          </div>
          <button
            type="button"
            className="ghost icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="settings-form">
          <section className="settings-section">
            <p className="eyebrow">Account</p>
            <div className="settings-grid">
              <label className="field" htmlFor="settings-name">
                <span>Name</span>
                <input
                  id="settings-name"
                  type="text"
                  value={name}
                  placeholder="Add your name"
                  onChange={event => onNameChange(event.target.value)}
                />
              </label>
              <label className="field" htmlFor="settings-email">
                <span>Email</span>
                <input
                  id="settings-email"
                  type="email"
                  value={email}
                  disabled
                />
              </label>
            </div>
          </section>

          <section className="settings-section">
            <p className="eyebrow">Preferences</p>
            <div className="settings-grid">
              <label className="field" htmlFor="settings-date-format">
                <span>Preferred date format</span>
                <select
                  id="settings-date-format"
                  value={dateFormat}
                  onChange={event =>
                    onDateFormatChange(event.target.value as DateFormatPreference)}
                >
                  <option value="mdy">Month / Day / Year</option>
                  <option value="dmy">Day / Month / Year</option>
                  <option value="ymd">Year / Month / Day</option>
                </select>
              </label>

              <div className="field">
                <span>Daily log reminder</span>
                <div className="settings-inline">
                  <label className="checkbox-row" htmlFor="settings-reminder">
                    <input
                      id="settings-reminder"
                      type="checkbox"
                      checked={remindersEnabled}
                      onChange={event => handleReminderToggle(event.target.checked)}
                      disabled={!remindersSupported}
                    />
                    <span>Enabled</span>
                  </label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={event => handleReminderTimeChange(event.target.value)}
                    disabled={!remindersEnabled || !remindersSupported}
                    aria-label="Reminder time"
                  />
                </div>
                {!remindersSupported
                  ? (
                      <p className="settings-note">
                        Reminders are available on the mobile app only.
                      </p>
                    )
                  : null}
              </div>

              <div className="field">
                <span>Appearance</span>
                <div className="toggle-group">
                  <button
                    type="button"
                    className={`ghost ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => onThemeChange('light')}
                  >
                    Light
                  </button>
                  <button
                    type="button"
                    className={`ghost ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => onThemeChange('dark')}
                  >
                    Dark
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
