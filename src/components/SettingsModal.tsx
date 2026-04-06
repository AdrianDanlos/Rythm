import { useEffect, useState, type FocusEvent } from 'react'
import { Capacitor } from '@capacitor/core'
import { useTranslation } from 'react-i18next'
import {
  cancelDailyReminder,
  getStoredDailyReminderEnabled,
  getStoredDailyReminderTime,
  scheduleDailyReminder,
  setStoredDailyReminderEnabled,
  setStoredDailyReminderTime,
} from '../lib/notifications'
import type {
  DateFormatPreference,
  LanguagePreference,
  ThemePreference,
} from '../lib/settings'
import appleLogo from '../assets/apple.png'
import fitbitLogo from '../assets/fitbit.png'

type SettingsModalProps = {
  isOpen: boolean
  onClose: () => void
  name: string
  email: string
  dateFormat: DateFormatPreference
  language: LanguagePreference
  theme: ThemePreference
  personalSleepTarget: number
  onNameChange: (value: string) => void
  onDateFormatChange: (value: DateFormatPreference) => void
  onLanguageChange: (value: LanguagePreference) => void
  onThemeChange: (value: ThemePreference) => void
  onPersonalSleepTargetChange: (value: number) => void
}

export const SettingsModal = ({
  isOpen,
  onClose,
  name,
  email,
  dateFormat,
  language,
  theme,
  personalSleepTarget,
  onNameChange,
  onDateFormatChange,
  onLanguageChange,
  onThemeChange,
  onPersonalSleepTargetChange,
}: SettingsModalProps) => {
  const { t } = useTranslation()
  const remindersSupported = Capacitor.isNativePlatform()
  const [remindersEnabled, setRemindersEnabled] = useState(
    () => getStoredDailyReminderEnabled(),
  )
  const [reminderTime, setReminderTime] = useState(
    () => getStoredDailyReminderTime(),
  )
  const [isDateFormatOpen, setIsDateFormatOpen] = useState(false)
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const [sleepTargetInput, setSleepTargetInput] = useState(
    () => String(personalSleepTarget),
  )

  const reminderActive = remindersSupported && remindersEnabled

  const dateFormatOptions: { value: DateFormatPreference, label: string }[] = [
    { value: 'dmy', label: t('settings.dayMonthYear') },
    { value: 'mdy', label: t('settings.monthDayYear') },
    { value: 'ymd', label: t('settings.yearMonthDay') },
  ]

  const languageOptions: { value: LanguagePreference, label: string }[] = [
    { value: 'en', label: t('settings.english') },
    { value: 'es', label: t('settings.spanish') },
    { value: 'fr', label: t('settings.french') },
    { value: 'pt', label: t('settings.brazilianPortuguese') },
    { value: 'de', label: t('settings.german') },
  ]

  const activeDateFormat = dateFormatOptions.find(option => option.value === dateFormat)
    ?? dateFormatOptions[0]

  const activeLanguage = languageOptions.find(option => option.value === language)
    ?? languageOptions[0]

  useEffect(() => {
    setSleepTargetInput(String(personalSleepTarget))
  }, [personalSleepTarget])

  const handleDateFormatSelect = (value: DateFormatPreference) => {
    onDateFormatChange(value)
    setIsDateFormatOpen(false)
  }

  const handleDateFormatBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
    setIsDateFormatOpen(false)
  }

  const handleLanguageSelect = (value: LanguagePreference) => {
    onLanguageChange(value)
    setIsLanguageOpen(false)
  }

  const handleLanguageBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
    setIsLanguageOpen(false)
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
            <h2 id="settings-title">{t('settings.title')}</h2>
          </div>
          <button
            type="button"
            className="ghost icon-button"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>

        <div className="settings-form">
          <section className="settings-section">
            <p className="eyebrow">{t('settings.account')}</p>
            <div className="settings-grid">
              <label className="field" htmlFor="settings-name">
                <span>{t('settings.name')}</span>
                <input
                  id="settings-name"
                  type="text"
                  value={name}
                  placeholder={t('settings.addYourName')}
                  onChange={event => onNameChange(event.target.value)}
                />
              </label>
              <label className="field settings-divider-none" htmlFor="settings-email">
                <span>{t('auth.email')}</span>
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
            <p className="eyebrow">{t('settings.preferences')}</p>
            <div className="settings-grid">
              <div className="field">
                <span>{t('settings.preferredDateFormat')}</span>
                <div className="tag-input" onBlur={handleDateFormatBlur}>
                  <input
                    id="settings-date-format"
                    type="text"
                    readOnly
                    value={activeDateFormat.label}
                    onClick={() => setIsDateFormatOpen(true)}
                    aria-haspopup="listbox"
                    aria-expanded={isDateFormatOpen}
                  />
                  <span className="tag-input-icon" aria-hidden="true">▾</span>
                  {isDateFormatOpen
                    ? (
                        <div className="tag-suggestions" role="listbox">
                          {dateFormatOptions.map(option => (
                            <button
                              key={option.value}
                              type="button"
                              className="tag-suggestion"
                              onPointerDown={(event) => {
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
              </div>

              <label className="field" htmlFor="settings-sleep-target">
                <span>{t('settings.personalSleepTargetHours')}</span>
                <input
                  id="settings-sleep-target"
                  type="number"
                  inputMode="decimal"
                  min={4}
                  max={12}
                  step={0.25}
                  value={sleepTargetInput}
                  onChange={(event) => {
                    setSleepTargetInput(event.target.value)
                  }}
                  onBlur={() => {
                    const trimmed = sleepTargetInput.trim()
                    if (trimmed === '') {
                      setSleepTargetInput(String(personalSleepTarget))
                      return
                    }
                    const parsed = Number(trimmed)
                    if (Number.isFinite(parsed)) {
                      onPersonalSleepTargetChange(parsed)
                      return
                    }
                    setSleepTargetInput(String(personalSleepTarget))
                  }}
                />
                <p className="settings-note">
                  {t('settings.sleepTargetHelper')}
                </p>
              </label>

              <div className="field">
                <span>{t('settings.language')}</span>
                <div className="tag-input" onBlur={handleLanguageBlur}>
                  <input
                    id="settings-language"
                    type="text"
                    readOnly
                    value={activeLanguage.label}
                    onClick={() => setIsLanguageOpen(true)}
                    aria-haspopup="listbox"
                    aria-expanded={isLanguageOpen}
                  />
                  <span className="tag-input-icon" aria-hidden="true">▾</span>
                  {isLanguageOpen
                    ? (
                        <div className="tag-suggestions" role="listbox">
                          {languageOptions.map(option => (
                            <button
                              key={option.value}
                              type="button"
                              className="tag-suggestion"
                              onPointerDown={(event) => {
                                event.preventDefault()
                                handleLanguageSelect(option.value)
                              }}
                              onClick={(event) => {
                                if (event.detail === 0) {
                                  handleLanguageSelect(option.value)
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
              </div>

              <div className="field">
                <span>{t('settings.appearance')}</span>
                <div className="toggle-group">
                  <button
                    type="button"
                    className={`ghost ${theme === 'system' ? 'active' : ''}`}
                    onClick={() => onThemeChange('system')}
                  >
                    {t('settings.system')}
                  </button>
                  <button
                    type="button"
                    className={`ghost ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => onThemeChange('dark')}
                  >
                    {t('settings.dark')}
                  </button>
                  <button
                    type="button"
                    className={`ghost ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => onThemeChange('light')}
                  >
                    {t('settings.light')}
                  </button>
                </div>
              </div>
              <div className="field">
                <span>{t('settings.dailyLogReminder')}</span>
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
                      {reminderActive ? t('settings.enabled') : t('settings.disabled')}
                    </span>
                  </label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={event => handleReminderTimeChange(event.target.value)}
                    disabled={!remindersEnabled || !remindersSupported}
                    aria-label={t('settings.reminderTime')}
                  />
                </div>
                {!remindersSupported
                  ? (
                      <p className="settings-note">
                        {t('settings.remindersMobileOnly')}
                      </p>
                    )
                  : null}
              </div>
              <div className="field">
                <span>{t('settings.wearableSync')}</span>
                <p className="settings-note">{t('settings.wearableSyncComingSoon')}</p>
                <div className="wearable-logos">
                  <img src={appleLogo} alt={t('settings.appleHealthAlt')} className="wearable-logo" />
                  <img src={fitbitLogo} alt={t('settings.fitbitAlt')} className="wearable-logo" />
                </div>
              </div>
            </div>
          </section>
          <div className="modal-actions modal-actions-right">
            <button type="button" className="ghost" onClick={onClose}>
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
