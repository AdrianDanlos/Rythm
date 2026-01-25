import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { fetchEntries, type Entry, upsertEntry } from './lib/entries'
import { buildStats } from './lib/stats'
import { LogForm } from './components/LogForm'
import { Insights } from './components/Insights'
import { useAuth } from './hooks/useAuth'
import logo from './assets/rythm-logo.png'
import './App.css'

function App() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const {
    session,
    authLoading,
    authError,
    signIn,
    signUp,
    signOut,
    setAuthError,
  } = useAuth()

  const [entries, setEntries] = useState<Entry[]>([])
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [entriesError, setEntriesError] = useState<string | null>(null)

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const todayDate = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])
  const today = useMemo(() => formatLocalDate(todayDate), [todayDate])
  const [entryDate, setEntryDate] = useState(today)
  const [sleepHours, setSleepHours] = useState('')
  const [mood, setMood] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'log' | 'insights'>('insights')

  const moodColors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e']
  const sleepThreshold = 8

  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) {
      setEntries([])
      return
    }

    const loadEntries = async () => {
      setEntriesLoading(true)
      setEntriesError(null)
      try {
        const data = await fetchEntries(userId)
        setEntries(data)
    } catch {
        setEntriesError('Unable to load entries.')
      } finally {
        setEntriesLoading(false)
      }
    }

    loadEntries()
  }, [session?.user?.id])

  useEffect(() => {
    const existing = entries.find((item) => item.entry_date === entryDate)
    if (existing) {
      setSleepHours(String(existing.sleep_hours))
      setMood(existing.mood)
      setNote(existing.note ?? '')
      return
    }

    setSleepHours('')
    setMood(null)
    setNote('')
  }, [entryDate, entries])

  const chartData = useMemo(
    () =>
      entries.map((entry) => ({
        ...entry,
        sleep_hours: Number(entry.sleep_hours),
        mood: Number(entry.mood),
      })),
    [entries],
  )

  const averages = useMemo(() => {
    if (!entries.length) {
      return { sleep: null, mood: null }
    }

    const totals = entries.reduce(
      (acc, entry) => {
        acc.sleep += Number(entry.sleep_hours)
        acc.mood += Number(entry.mood)
        return acc
      },
      { sleep: 0, mood: 0 },
    )

    return {
      sleep: totals.sleep / entries.length,
      mood: totals.mood / entries.length,
    }
  }, [entries])

  const highlightedDates = useMemo(() => {
    const uniqueDates = new Map<string, Date>()
    entries.forEach((entry) => {
      const date = new Date(`${entry.entry_date}T00:00:00`)
      date.setHours(0, 0, 0, 0)
      uniqueDates.set(entry.entry_date, date)
    })
    return Array.from(uniqueDates.values())
  }, [entries])

  const selectedDate = useMemo(
    () => new Date(`${entryDate}T00:00:00`),
    [entryDate],
  )

  const stats = useMemo(
    () => buildStats(entries, sleepThreshold, formatLocalDate),
    [entries, sleepThreshold],
  )

  const handleAuth = async (event: FormEvent) => {
    event.preventDefault()
    setAuthError(null)
    setAuthMessage(null)

    try {
      if (authMode === 'signup') {
        const { error } = await signUp(authEmail, authPassword)
        if (error) throw error
        setAuthMessage('Check your email to confirm your account.')
      } else {
        const { error } = await signIn(authEmail, authPassword)
        if (error) throw error
      }
    } catch {
      setAuthError('Unable to authenticate. Check your details.')
    }
  }

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()
    if (!session?.user?.id) return

    if (entryDate > today) {
      setEntriesError('You cannot log entries in the future.')
      setSaved(false)
      return
    }

    const parsedSleep = Number(sleepHours)
    if (!Number.isFinite(parsedSleep) || parsedSleep < 0 || parsedSleep > 12) {
      setEntriesError('Sleep hours must be between 0 and 12.')
      setSaved(false)
      return
    }
    if (!mood) {
      setEntriesError('Select a mood rating.')
      setSaved(false)
      return
    }

    setSaving(true)
    setEntriesError(null)
    try {
      const saved = await upsertEntry({
        user_id: session.user.id,
        entry_date: entryDate,
        sleep_hours: parsedSleep,
        mood,
        note: note.trim() ? note.trim() : null,
      })

      setEntries((prev) => {
        const filtered = prev.filter((item) => item.entry_date !== entryDate)
        return [...filtered, saved].sort((a, b) =>
          a.entry_date.localeCompare(b.entry_date),
        )
      })
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2000)
    } catch {
      setEntriesError('Unable to save entry.')
      setSaved(false)
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleExportCsv = () => {
    if (!entries.length) return
    const escapeCsv = (value: string | number | null) => {
      const stringValue = value === null ? '' : String(value)
      if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }

    const rows = [
      ['date', 'sleep_hours', 'mood', 'note'],
      ...entries.map((entry) => [
        entry.entry_date,
        entry.sleep_hours,
        entry.mood,
        entry.note ?? '',
      ]),
    ]

    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'rythm-entries.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <img className="app-logo" src={logo} alt="Rythm logo" />
          <div>
            <p className="eyebrow">Sleep &amp; Mood</p>
            <h1>Rythm</h1>
          </div>
        </div>
        {session ? (
          <button className="ghost" onClick={handleSignOut} type="button">
            Sign out
          </button>
        ) : null}
      </header>

      {!session ? (
        <section className="card auth-card">
          <h2>{authMode === 'signin' ? 'Sign in' : 'Create account'}</h2>
          <p className="muted">
            Use email + password to keep your entries private.
          </p>
          <form onSubmit={handleAuth} className="stack">
            <label className="field">
              Email
              <input
                type="email"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                placeholder="you@email.com"
                required
              />
            </label>
            <label className="field">
              Password
              <input
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
            </label>
            {authError ? <p className="error">{authError}</p> : null}
            {authMessage ? <p className="success">{authMessage}</p> : null}
            <button type="submit" disabled={authLoading}>
              {authLoading
                ? 'Working...'
                : authMode === 'signin'
                  ? 'Sign in'
                  : 'Sign up'}
            </button>
          </form>
          <button
            className="ghost"
            type="button"
            onClick={() =>
              setAuthMode((mode) => (mode === 'signin' ? 'signup' : 'signin'))
            }
          >
            {authMode === 'signin'
              ? 'Need an account? Sign up'
              : 'Already have an account? Sign in'}
          </button>
        </section>
      ) : (
        <>
          <div className="tabs">
            <button
              type="button"
              className={`tab-button ${activeTab === 'insights' ? 'active' : ''}`}
              onClick={() => setActiveTab('insights')}
            >
              Insights
            </button>
            <button
              type="button"
              className={`tab-button ${activeTab === 'log' ? 'active' : ''}`}
              onClick={() => setActiveTab('log')}
            >
              Log
            </button>
          </div>

          {activeTab === 'log' ? (
            <LogForm
              selectedDate={selectedDate}
              todayDate={todayDate}
              highlightedDates={highlightedDates}
              sleepHours={sleepHours}
              mood={mood}
              note={note}
              saving={saving}
              saved={saved}
              entriesError={entriesError}
              moodColors={moodColors}
              formatLocalDate={formatLocalDate}
              onEntryDateChange={setEntryDate}
              onSleepHoursChange={setSleepHours}
              onMoodChange={setMood}
              onNoteChange={setNote}
              onSave={handleSave}
            />
          ) : (
            <Insights
              entries={entries}
              entriesLoading={entriesLoading}
              chartData={chartData}
              averages={averages}
              windowAverages={stats.windowAverages}
              streak={stats.streak}
              sleepConsistencyLabel={stats.sleepConsistencyLabel}
              correlationLabel={stats.correlationLabel}
              correlationDirection={stats.correlationDirection}
              moodBySleepThreshold={stats.moodBySleepThreshold}
              sleepThreshold={sleepThreshold}
              moodColors={moodColors}
              onExportCsv={handleExportCsv}
            />
          )}
        </>
      )}
    </div>
  )
}

export default App
