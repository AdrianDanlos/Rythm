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

  const moodColors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e']

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
    if (!Number.isFinite(parsedSleep) || parsedSleep < 0 || parsedSleep > 24) {
      setEntriesError('Sleep hours must be between 0 and 24.')
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
                  max={24}
                  step={0.1}
                  value={sleepHours}
                  onChange={(event) => setSleepHours(event.target.value)}
                  placeholder="0-24"
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
              </p>
            </div>
          </section>

          <section className="card chart-card">
            <div className="chart-header">
              <h2>Sleep vs mood</h2>
              <p className="muted">
                {entriesLoading
                  ? 'Loading entries...'
                  : `${entries.length} entries`}
              </p>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <XAxis
                    type="number"
                    dataKey="sleep_hours"
                    domain={[0, 24]}
                    tickCount={7}
                    label={{ value: 'Sleep hours', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="mood"
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    label={{ value: 'Mood', angle: -90, position: 'insideLeft' }}
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
    </div>
  )
}

export default App
