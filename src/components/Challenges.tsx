import { useEffect, useMemo, useState } from 'react'
import type { Entry } from '../lib/entries'
import {
  createChallenge,
  fetchChallengeCheckins,
  fetchChallengeMembers,
  fetchChallengeMemberships,
  joinChallengeByInviteCode,
  upsertChallengeCheckins,
  type Challenge,
  type ChallengeCheckin,
  type ChallengeMember,
  type ChallengeMembership,
} from '../lib/challenges'
import { formatLocalDate, formatShortDate } from '../lib/utils/dateFormatters'

const CHALLENGE_DAYS = 7
const INVITE_CODE_LENGTH = 8
const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

type ChallengesProps = {
  userId: string
  entries: Entry[]
}

const buildInviteCode = () => {
  const cryptoObj = window.crypto || (window as unknown as { msCrypto?: Crypto }).msCrypto
  const values = cryptoObj?.getRandomValues
    ? cryptoObj.getRandomValues(new Uint32Array(INVITE_CODE_LENGTH))
    : Array.from({ length: INVITE_CODE_LENGTH }, () => Math.floor(Math.random() * 0xffffffff))
  return Array.from(values, (value) => INVITE_ALPHABET[value % INVITE_ALPHABET.length]).join('')
}

const addDays = (startDate: string, days: number) => {
  const date = new Date(`${startDate}T00:00:00`)
  date.setDate(date.getDate() + days)
  return formatLocalDate(date)
}

const toDate = (date: string) => new Date(`${date}T00:00:00`)

const getInviteFromUrl = () => {
  const params = new URLSearchParams(window.location.search)
  return params.get('invite')?.trim() ?? ''
}

const clearInviteFromUrl = () => {
  const url = new URL(window.location.href)
  url.searchParams.delete('invite')
  window.history.replaceState({}, '', url.pathname + url.search + url.hash)
}

const isWithinRange = (value: string, start: string, end: string) =>
  value >= start && value <= end

const getDaysRemaining = (start: string, end: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = toDate(start)
  const endDate = toDate(end)
  if (today < startDate) return CHALLENGE_DAYS
  const diffMs = endDate.getTime() - today.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays + 1)
}

export const Challenges = ({ userId, entries }: ChallengesProps) => {
  const [memberships, setMemberships] = useState<ChallengeMembership[]>([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [inviteCodeInput, setInviteCodeInput] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [membersByChallenge, setMembersByChallenge] = useState<Record<string, ChallengeMember[]>>({})
  const [checkinsByChallenge, setCheckinsByChallenge] = useState<Record<string, ChallengeCheckin[]>>({})
  const [copiedChallengeId, setCopiedChallengeId] = useState<string | null>(null)

  const today = useMemo(() => formatLocalDate(new Date()), [])

  const refreshMemberships = async () => {
    setMembersLoading(true)
    setActionError(null)
    try {
      const data = await fetchChallengeMemberships(userId)
      setMemberships(data)
    }
    catch {
      setActionError('Unable to load shared challenges.')
    }
    finally {
      setMembersLoading(false)
    }
  }

  const syncCheckins = async (challenge: Challenge) => {
    const entryDates = entries
      .filter(entry => isWithinRange(entry.entry_date, challenge.start_date, challenge.end_date))
      .map(entry => entry.entry_date)
    if (!entryDates.length) return
    await upsertChallengeCheckins({
      challengeId: challenge.id,
      userId,
      entryDates,
    })
  }

  const loadChallengeDetails = async (challenge: Challenge) => {
    try {
      await syncCheckins(challenge)
      const [members, checkins] = await Promise.all([
        fetchChallengeMembers(challenge.id),
        fetchChallengeCheckins(challenge.id),
      ])
      setMembersByChallenge(prev => ({ ...prev, [challenge.id]: members }))
      setCheckinsByChallenge(prev => ({ ...prev, [challenge.id]: checkins }))
    }
    catch {
      setActionError('Unable to load challenge details.')
    }
  }

  useEffect(() => {
    void refreshMemberships()
  }, [userId])

  useEffect(() => {
    if (!memberships.length) return
    void Promise.all(memberships.map(membership => loadChallengeDetails(membership.challenge)))
  }, [memberships, entries])

  useEffect(() => {
    const inviteCode = getInviteFromUrl()
    if (!inviteCode) return
    void handleJoin(inviteCode, true)
  }, [userId])

  const handleCreate = async () => {
    setIsCreating(true)
    setActionError(null)
    setActionMessage(null)
    try {
      const startDate = today
      const endDate = addDays(startDate, CHALLENGE_DAYS - 1)
      const challenge = await createChallenge({
        ownerId: userId,
        title: '7-day sleep + mood challenge',
        inviteCode: buildInviteCode(),
        startDate,
        endDate,
      })
      await joinChallengeByInviteCode({ userId, inviteCode: challenge.invite_code })
      setActionMessage('Challenge created. Share the invite link below.')
      await refreshMemberships()
    }
    catch {
      setActionError('Unable to create a challenge right now.')
    }
    finally {
      setIsCreating(false)
    }
  }

  const handleJoin = async (codeOverride?: string, clearUrl = false) => {
    const inviteCode = (codeOverride ?? inviteCodeInput).trim().toUpperCase()
    if (!inviteCode) {
      setActionError('Enter an invite code to join.')
      return
    }
    setIsJoining(true)
    setActionError(null)
    setActionMessage(null)
    try {
      await joinChallengeByInviteCode({ userId, inviteCode })
      setInviteCodeInput('')
      setActionMessage('Joined the challenge.')
      await refreshMemberships()
      if (clearUrl) {
        clearInviteFromUrl()
      }
    }
    catch {
      setActionError('Invite code not found.')
    }
    finally {
      setIsJoining(false)
    }
  }

  const handleCopyInvite = async (challenge: Challenge) => {
    const inviteUrl = `${window.location.origin}/?invite=${challenge.invite_code}`
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopiedChallengeId(challenge.id)
      window.setTimeout(() => setCopiedChallengeId(null), 2000)
    }
    catch {
      setActionError('Unable to copy invite link.')
    }
  }

  const getMemberProgress = (challengeId: string, memberId: string) => {
    const checkins = checkinsByChallenge[challengeId] ?? []
    const uniqueDates = new Set(
      checkins
        .filter(checkin => checkin.user_id === memberId)
        .map(checkin => checkin.entry_date),
    )
    return uniqueDates.size
  }

  const formatChallengeRange = (challenge: Challenge) =>
    `${formatShortDate(challenge.start_date)} - ${formatShortDate(challenge.end_date)}`

  return (
    <div className="challenge-stack">
      <section className="card">
        <div className="card-header">
          <div>
            <h2>Shared challenges</h2>
            <p className="muted">Create a 7-day sprint and invite friends to compare progress.</p>
          </div>
        </div>
        <div className="challenge-actions">
          <button
            className="primary-button"
            type="button"
            onClick={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create 7-day challenge'}
          </button>
          <div className="challenge-join">
            <input
              type="text"
              placeholder="Invite code"
              value={inviteCodeInput}
              onChange={event => setInviteCodeInput(event.target.value)}
            />
            <button
              className="ghost"
              type="button"
              onClick={() => handleJoin()}
              disabled={isJoining}
            >
              {isJoining ? 'Joining...' : 'Join'}
            </button>
          </div>
          <p className="helper">Invite codes are case-insensitive.</p>
          {actionError ? <p className="error">{actionError}</p> : null}
          {actionMessage ? <p className="success">{actionMessage}</p> : null}
        </div>
      </section>

      {membersLoading
        ? (
            <section className="card">
              <p className="muted">Loading your challenges...</p>
            </section>
          )
        : memberships.length === 0
            ? (
                <section className="card">
                  <p className="muted">No shared challenges yet.</p>
                </section>
              )
            : (
                <div className="challenge-list">
                  {memberships.map(({ challenge }) => {
                    const isOwner = challenge.owner_id === userId
                    const daysRemaining = getDaysRemaining(challenge.start_date, challenge.end_date)
                    const progress = getMemberProgress(challenge.id, userId)
                    const progressPercent = Math.min(
                      100,
                      Math.round((progress / CHALLENGE_DAYS) * 100),
                    )
                    const members = membersByChallenge[challenge.id] ?? []
                    return (
                      <section className="card" key={challenge.id}>
                        <div className="card-header">
                          <div>
                            <h3>{challenge.title}</h3>
                            <p className="muted">
                              {formatChallengeRange(challenge)}
                              {' '}
                              · {daysRemaining} day{daysRemaining === 1 ? '' : 's'} left
                            </p>
                          </div>
                          {isOwner ? <span className="pill">Owner</span> : null}
                        </div>

                        <div className="challenge-meta">
                          <div>
                            <p className="helper">Your progress</p>
                            <div className="progress-row">
                              <div className="progress-bar" role="presentation">
                                <span style={{ width: `${progressPercent}%` }} />
                              </div>
                              <span className="progress-text">{progress}/{CHALLENGE_DAYS}</span>
                            </div>
                          </div>

                          <div className="invite-row">
                            <span className="invite-label">Invite link</span>
                            <button
                              type="button"
                              className="ghost"
                              onClick={() => handleCopyInvite(challenge)}
                            >
                              {copiedChallengeId === challenge.id ? 'Copied!' : 'Copy link'}
                            </button>
                            <span className="invite-code">{challenge.invite_code}</span>
                          </div>
                        </div>

                        <div className="participants">
                          <div className="participants-header">
                            <p className="helper">Participants</p>
                            <span className="muted">{members.length} total</span>
                          </div>
                          {members.length === 0
                            ? <p className="muted">Waiting for friends to join.</p>
                            : (
                                <div className="participants-list">
                                  {members.map(member => {
                                    const memberProgress = getMemberProgress(challenge.id, member.user_id)
                                    const memberPercent = Math.min(
                                      100,
                                      Math.round((memberProgress / CHALLENGE_DAYS) * 100),
                                    )
                                    const name = member.user_id === userId
                                      ? 'You'
                                      : `Member ${member.user_id.slice(0, 6)}`
                                    return (
                                      <div className="participant-row" key={member.id}>
                                        <div>
                                          <p className="participant-name">{name}</p>
                                          <p className="muted">{memberProgress}/{CHALLENGE_DAYS} days</p>
                                        </div>
                                        <div className="participant-progress">
                                          <div className="progress-bar mini" role="presentation">
                                            <span style={{ width: `${memberPercent}%` }} />
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                        </div>
                      </section>
                    )
                  })}
                </div>
              )}
    </div>
  )
}
