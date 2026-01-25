import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Session } from '@supabase/supabase-js'
import { fetchEntries, type Entry, upsertEntry } from './lib/entries'
import { supabase } from './lib/supabaseClient'
import './App.css'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)

  const [entries, setEntries] = useState<Entry[]>([])
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [entriesError, setEntriesError] = useState<string | null>(null)

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [entryDate, setEntryDate] = useState(today)
  const [sleepHours, setSleepHours] = useState('')
  const [mood, setMood] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'log' | 'insights'>('log')

  const moodColors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e']
  const sleepThreshold = 8

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

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

  const entriesWithDate = useMemo(
    () =>
      entries.map((entry) => {
        const date = new Date(`${entry.entry_date}T00:00:00`)
        date.setHours(0, 0, 0, 0)
        return { ...entry, date }
      }),
    [entries],
  )

  const windowAverages = useMemo(() => {
    const buildWindow = (days: number) => {
      const end = new Date()
      end.setHours(0, 0, 0, 0)
      const start = new Date(end)
      start.setDate(end.getDate() - (days - 1))

      const windowEntries = entriesWithDate.filter(
        (entry) => entry.date >= start && entry.date <= end,
      )

      if (!windowEntries.length) {
        return { sleep: null, mood: null, count: 0 }
      }

      const totals = windowEntries.reduce(
        (acc, entry) => {
          acc.sleep += Number(entry.sleep_hours)
          acc.mood += Number(entry.mood)
          return acc
        },
        { sleep: 0, mood: 0 },
      )

      return {
        sleep: totals.sleep / windowEntries.length,
        mood: totals.mood / windowEntries.length,
        count: windowEntries.length,
      }
    }

    return {
      last7: buildWindow(7),
      last30: buildWindow(30),
    }
  }, [entriesWithDate])

  const streak = useMemo(() => {
    if (!entriesWithDate.length) return 0
    const dateSet = new Set(entriesWithDate.map((entry) => entry.entry_date))
    const latestDate = entriesWithDate.reduce(
      (max, entry) => (entry.entry_date > max ? entry.entry_date : max),
      entriesWithDate[0].entry_date,
    )

    const current = new Date(`${latestDate}T00:00:00`)
    let count = 0
    while (true) {
      const key = current.toISOString().slice(0, 10)
      if (!dateSet.has(key)) break
      count += 1
      current.setDate(current.getDate() - 1)
    }
    return count
  }, [entriesWithDate])

  const sleepConsistency = useMemo(() => {
    if (!entries.length) return null
    const mean =
      entries.reduce((sum, entry) => sum + Number(entry.sleep_hours), 0) /
      entries.length
    const variance =
      entries.reduce((sum, entry) => {
        const diff = Number(entry.sleep_hours) - mean
        return sum + diff * diff
      }, 0) / entries.length
    return Math.sqrt(variance)
  }, [entries])

  const sleepConsistencyLabel = useMemo(() => {
    if (sleepConsistency === null) return null
    if (sleepConsistency <= 0.9) return 'Very consistent'
    if (sleepConsistency <= 2.0) return 'Consistent'
    if (sleepConsistency <= 3.5) return 'Mixed'
    return 'Unstable'
  }, [sleepConsistency])

  const sleepMoodCorrelation = useMemo(() => {
    if (entries.length < 2) return null
    const meanSleep =
      entries.reduce((sum, entry) => sum + Number(entry.sleep_hours), 0) /
      entries.length
    const meanMood =
      entries.reduce((sum, entry) => sum + Number(entry.mood), 0) / entries.length

    let numerator = 0
    let sumSleep = 0
    let sumMood = 0

    entries.forEach((entry) => {
      const sleepDelta = Number(entry.sleep_hours) - meanSleep
      const moodDelta = Number(entry.mood) - meanMood
      numerator += sleepDelta * moodDelta
      sumSleep += sleepDelta * sleepDelta
      sumMood += moodDelta * moodDelta
    })

    const denominator = Math.sqrt(sumSleep * sumMood)
    if (denominator === 0) return null
    return numerator / denominator
  }, [entries])

  const correlationLabel = useMemo(() => {
    if (sleepMoodCorrelation === null) return null
    const magnitude = Math.abs(sleepMoodCorrelation)
    const strength =
      magnitude < 0.2
        ? 'No clear'
        : magnitude < 0.4
          ? 'Weak'
          : magnitude < 0.7
            ? 'Moderate'
            : 'Strong'
    return strength
  }, [sleepMoodCorrelation])

  const correlationDirection = useMemo(() => {
    if (sleepMoodCorrelation === null) return null
    if (sleepMoodCorrelation > 0.05) return 'Higher sleep, better mood'
    if (sleepMoodCorrelation < -0.05) return 'Higher sleep, lower mood'
    return 'No clear direction'
  }, [sleepMoodCorrelation])


  const moodBySleepThreshold = useMemo(() => {
    if (!entries.length) return { high: null, low: null }
    const buckets = entries.reduce(
      (acc, entry) => {
        const target = Number(entry.sleep_hours) >= sleepThreshold ? 'high' : 'low'
        acc[target].sum += Number(entry.mood)
        acc[target].count += 1
        return acc
      },
      {
        high: { sum: 0, count: 0 },
        low: { sum: 0, count: 0 },
      },
    )

    return {
      high: buckets.high.count ? buckets.high.sum / buckets.high.count : null,
      low: buckets.low.count ? buckets.low.sum / buckets.low.count : null,
    }
  }, [entries, sleepThreshold])

  const handleAuth = async (event: FormEvent) => {
    event.preventDefault()
    setAuthLoading(true)
    setAuthError(null)
    setAuthMessage(null)

    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        })
        if (error) throw error
        setAuthMessage('Check your email to confirm your account.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        })
        if (error) throw error
      }
    } catch {
      setAuthError('Unable to authenticate. Check your details.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()
    if (!session?.user?.id) return

    const parsedSleep = Number(sleepHours)
    if (!Number.isFinite(parsedSleep) || parsedSleep < 0 || parsedSleep > 12) {
      setEntriesError('Sleep hours must be between 0 and 12.')
      return
    }
    if (!mood) {
      setEntriesError('Select a mood rating.')
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
    } catch {
      setEntriesError('Unable to save entry.')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const renderTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: ReadonlyArray<{ payload: Entry }>
  }) => {
    if (!active || !payload?.length) return null
    const entry = payload[0]?.payload as Entry | undefined
    if (!entry) return null
    return (
      <div className="tooltip">
        <p>{entry.entry_date}</p>
        <p>Sleep: {entry.sleep_hours} hrs</p>
        <p>Mood: {entry.mood}</p>
        {entry.note ? <p className="tooltip-note">{entry.note}</p> : null}
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">Sleep vs Mood</p>
          <h1>Daily tracker</h1>
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
              className={`tab-button ${activeTab === 'log' ? 'active' : ''}`}
              onClick={() => setActiveTab('log')}
            >
              Log
            </button>
            <button
              type="button"
              className={`tab-button ${activeTab === 'insights' ? 'active' : ''}`}
              onClick={() => setActiveTab('insights')}
            >
              Insights
            </button>
          </div>

          {activeTab === 'log' ? (
            <section className="card">
              <h2>Log today</h2>
              <form onSubmit={handleSave} className="stack">
                <label className="field">
                  Date
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(event) => setEntryDate(event.target.value)}
                  />
                </label>
                <label className="field">
                  Sleep hours
                  <input
                    type="number"
                    min={0}
                    max={12}
                    step={0.1}
                    value={sleepHours}
                    onChange={(event) => setSleepHours(event.target.value)}
                    placeholder="0-12"
                    required
                  />
                </label>
                <div className="field">
                  Mood
                  <div className="mood-row">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={`mood-button ${mood === value ? 'active' : ''}`}
                        onClick={() => setMood(value)}
                        style={{ borderColor: moodColors[value - 1] }}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="field">
                  Note (optional)
                  <input
                    type="text"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Short reflection..."
                    maxLength={140}
                  />
                </label>
                {entriesError ? <p className="error">{entriesError}</p> : null}
                <button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save entry'}
                </button>
              </form>
            </section>
          ) : (
            <>
              <section className="card stats">
                <div>
                  <p className="label">Average sleep</p>
                  <p className="value">
                    {averages.sleep !== null
                      ? `${averages.sleep.toFixed(1)} hrs`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="label">Average mood</p>
                  <p className="value">
                    {averages.mood !== null ? averages.mood.toFixed(1) : '—'}
                    {' '}/ 5
                  </p>
                </div>
              </section>

              <section className="card stats-grid">
                <div className="stat">
                  <p className="label">Last 7 days</p>
                  <p className="value">
                    {windowAverages.last7.sleep !== null &&
                    windowAverages.last7.mood !== null
                      ? `${windowAverages.last7.sleep.toFixed(1)}h / ${windowAverages.last7.mood.toFixed(1)}`
                      : '—'}
                  </p>
                  <p className="helper">
                    Sleep avg / Mood avg · {windowAverages.last7.count} entries
                  </p>
                </div>
                <div className="stat">
                  <p className="label">Last 30 days</p>
                  <p className="value">
                    {windowAverages.last30.sleep !== null &&
                    windowAverages.last30.mood !== null
                      ? `${windowAverages.last30.sleep.toFixed(1)}h / ${windowAverages.last30.mood.toFixed(1)}`
                      : '—'}
                  </p>
                  <p className="helper">
                    Sleep avg / Mood avg · {windowAverages.last30.count} entries
                  </p>
                </div>
                <div className="stat">
                  <p className="label">Streak</p>
                  <p className="value">{streak} days</p>
                  <p className="helper">Consecutive days logged</p>
                </div>
                <div className="stat">
                  <p className="label">Sleep consistency</p>
                  <p className="value">
                    {sleepConsistencyLabel ?? '—'}
                  </p>
                  <p className="helper">
                    How steady your sleep hours are
                  </p>
                </div>
                <div className="stat">
                  <p className="label">Sleep–mood link</p>
                  <p className="value">
                    {correlationLabel ?? '—'}
                  </p>
                  {correlationDirection ? (
                    <p className="helper">{correlationDirection}</p>
                  ) : null}
                </div>
                <div className="stat">
                  <p className="label">Mood by sleep</p>
                  <p className="value">
                    {moodBySleepThreshold.high !== null ||
                    moodBySleepThreshold.low !== null
                      ? `≥${sleepThreshold}h ${moodBySleepThreshold.high?.toFixed(1) ?? '—'} / <${sleepThreshold}h ${moodBySleepThreshold.low?.toFixed(1) ?? '—'}`
                      : '—'}
                  </p>
                  <p className="helper">
                    Avg mood split at {sleepThreshold} hours
                  </p>
                </div>
              </section>

              <section className="card chart-card">
                <div className="chart-header">
                  <h2>Sleep vs Mood</h2>
                  <p className="muted">
                    {entriesLoading
                      ? 'Loading entries...'
                      : `${entries.length} entries`}
                  </p>
                </div>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={260}>
                    <ScatterChart margin={{ top: 12, right: 12, bottom: 12, left: 5 }}>
                      <XAxis
                        type="number"
                        dataKey="sleep_hours"
                        domain={[4, 10]}
                        ticks={[4, 5, 6, 7, 8, 9, 10]}
                        tickFormatter={(value) => {
                          if (value === 4) return '≤4'
                          if (value === 10) return '≥10'
                          return String(value)
                        }}
                        label={{
                          value: 'Sleep hours',
                          position: 'insideBottom',
                          offset: -5,
                        }}
                        height={35}
                        tickMargin={2}
                      />
                      <YAxis
                        type="number"
                        dataKey="mood"
                        domain={[1, 5]}
                        ticks={[1, 2, 3, 4, 5]}
                        label={{
                          value: 'Mood',
                          angle: -90,
                          position: 'insideLeft',
                          offset: 0,
                        }}
                        width={35}
                        tickMargin={2}
                      />
                      <Tooltip content={renderTooltip} />
                      <Scatter data={chartData}>
                        {chartData.map((entry) => (
                          <Cell
                            key={entry.id}
                            fill={moodColors[entry.mood - 1]}
                            fillOpacity={0.85}
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default App
