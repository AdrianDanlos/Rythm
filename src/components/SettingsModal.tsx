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
import appleLogo from '../assets/apple.png'
import fitbitLogo from '../assets/fitbit.png'

type SettingsModalProps = {
  isOpen: boolean
  onClose: () => void
  name: string
  email: string
  dateFormat: DateFormatPreference
  theme: ThemePreference
  personalSleepTarget: number
  onNameChange: (value: string) => void
  onDateFormatChange: (value: DateFormatPreference) => void
  onThemeChange: (value: ThemePreference) => void
  onPersonalSleepTargetChange: (value: number) => void
}

export const SettingsModal = ({
  isOpen,
  onClose,
  name,
  email,
  dateFormat,
  theme,
  personalSleepTarget,
  onNameChange,
  onDateFormatChange,
  onThemeChange,
  onPersonalSleepTargetChange,
}: SettingsModalProps) => {
  const remindersSupported = Capacitor.isNativePlatform()
  const [remindersEnabled, setRemindersEnabled] = useState(
    () => getStoredDailyReminderEnabled(),
  )
  const [reminderTime, setReminderTime] = useState(
    () => getStoredDailyReminderTime(),
  )
  const [isDateFormatOpen, setIsDateFormatOpen] = useState(false)
  const [sleepTargetInput, setSleepTargetInput] = useState(
    () => String(personalSleepTarget),
  )

  const reminderActive = remindersSupported && remindersEnabled

  const dateFormatOptions: { value: DateFormatPreference, label: string }[] = [
    { value: 'dmy', label: 'Day / Month / Year' },
    { value: 'mdy', label: 'Month / Day / Year' },
    { value: 'ymd', label: 'Year / Month / Day' },
  ]

  const activeDateFormat = dateFormatOptions.find(option => option.value === dateFormat)
    ?? dateFormatOptions[0]

  useEffect(() => {
    setSleepTargetInput(String(personalSleepTarget))
  }, [personalSleepTarget])

  const handleDateFormatSelect = (value: DateFormatPreference) => {
    onDateFormatChange(value)
    setIsDateFormatOpen(false)
  }

  useEffect(() => {
    if (!remindersSupported || !remindersEnabled) return
    void scheduleDailyReminder({ time: reminderTime })
  }, [reminderTime, remindersEnabled, remindersSupported])

  const handleReminderToggle = async (enabled: boolean) => {
    setRemindersEnabled(enabled)
    setStoredDailyReminderEnabled(enabled)

    if (!remindersSupported) return

    if (enabled) {
      const scheduled = await scheduleDailyReminder({
        time: reminderTime,
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
    await scheduleDailyReminder({ time: value, force: true })
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
              <label className="field settings-divider-none" htmlFor="settings-email">
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
                <div className="tag-input">
                  <input
                    id="settings-date-format"
                    type="text"
                    readOnly
                    value={activeDateFormat.label}
                    onFocus={() => setIsDateFormatOpen(true)}
                    onBlur={() => setIsDateFormatOpen(false)}
                    onClick={() => setIsDateFormatOpen(true)}
                    aria-haspopup="listbox"
                    aria-expanded={isDateFormatOpen}
                  />
                  {isDateFormatOpen
                    ? (
                        <div className="tag-suggestions" role="listbox">
                          {dateFormatOptions.map(option => (
                            <button
                              key={option.value}
                              type="button"
                              className="tag-suggestion"
                              onMouseDown={(event) => {
                                event.preventDefault()
                                handleDateFormatSelect(option.value)
                              }}
                              onClick={(event) => {
                                if (event.detail === 0) {
                                  handleDateFormatSelect(option.value)
                                }
                              }}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )
                    : null}
                </div>
              </label>

              <label className="field" htmlFor="settings-sleep-target">
                <span>Personal target sleep (hours)</span>
                <input
                  id="settings-sleep-target"
                  type="number"
                  inputMode="decimal"
                  min={4}
                  max={12}
                  step={0.5}
                  value={sleepTargetInput}
                  onChange={(event) => {
                    setSleepTargetInput(event.target.value)
                  }}
                  onBlur={() => {
                    const parsed = Number(sleepTargetInput)
                    if (Number.isFinite(parsed)) {
                      onPersonalSleepTargetChange(parsed)
                      return
                    }
                    setSleepTargetInput(String(personalSleepTarget))
                  }}
                />
                <p className="settings-note">
                  Used for avg sleep target and mood-by-sleep comparisons.
                </p>
              </label>

              <div className="field">
                <span>Appearance</span>
                <div className="toggle-group">
                  <button
                    type="button"
                    className={`ghost ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => onThemeChange('dark')}
                  >
                    Dark
                  </button>
                  <button
                    type="button"
                    className={`ghost ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => onThemeChange('light')}
                  >
                    Light
                  </button>
                </div>
              </div>
              <div className="field">
                <span>Daily log reminder</span>
                <div className="settings-inline">
                  <label className="toggle-row">
                    <input
                      id="settings-reminder"
                      type="checkbox"
                      checked={remindersEnabled}
                      onChange={event => handleReminderToggle(event.target.checked)}
                      disabled={!remindersSupported}
                    />
                    <span className="toggle-track" aria-hidden="true">
                      <span className="toggle-thumb" />
                    </span>
                    <span className="toggle-text">
                      {reminderActive ? 'Enabled' : 'Disabled'}
                    </span>
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
                <span>Wearable sync</span>
                <p className="settings-note">Sync sleep from wearable (coming soon)</p>
                <div className="wearable-logos">
                  <img src={appleLogo} alt="Apple Health" className="wearable-logo" />
                  <img src={fitbitLogo} alt="Fitbit" className="wearable-logo" />
                </div>
              </div>
            </div>
          </section>
          <div className="modal-actions modal-actions-right">
            <button type="button" className="ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
