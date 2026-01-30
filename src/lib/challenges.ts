import { supabase } from './supabaseClient'

export type Challenge = {
  id: string
  owner_id: string
  title: string
  invite_code: string
  start_date: string
  end_date: string
  created_at: string
}

export type ChallengeMembership = {
  id: string
  user_id: string
  challenge_id: string
  joined_at: string
  challenge: Challenge
}

export type ChallengeMember = {
  id: string
  user_id: string
  joined_at: string
}

export type ChallengeCheckin = {
  id: string
  user_id: string
  entry_date: string
}

type MembershipRow = {
  id: string
  user_id: string
  challenge_id: string
  joined_at: string
  challenges: Challenge | Challenge[] | null
}

export async function fetchChallengeMemberships(userId: string) {
  const { data, error } = await supabase
    .from('challenge_members')
    .select(`
      id,
      user_id,
      challenge_id,
      joined_at,
      challenges (
        id,
        owner_id,
        title,
        invite_code,
        start_date,
        end_date,
        created_at
      )
    `)
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data as unknown as MembershipRow[] ?? [])
    .map((row): ChallengeMembership | null => {
      const challenge = Array.isArray(row.challenges)
        ? row.challenges[0]
        : row.challenges
      if (!challenge) return null
      return {
        id: row.id,
        user_id: row.user_id,
        challenge_id: row.challenge_id,
        joined_at: row.joined_at,
        challenge,
      }
    })
    .filter((row): row is ChallengeMembership => Boolean(row))
}

export async function createChallenge(params: {
  ownerId: string
  title: string
  inviteCode: string
  startDate: string
  endDate: string
}) {
  const { data, error } = await supabase
    .from('challenges')
    .insert({
      owner_id: params.ownerId,
      title: params.title,
      invite_code: params.inviteCode,
      start_date: params.startDate,
      end_date: params.endDate,
    })
    .select('id, owner_id, title, invite_code, start_date, end_date, created_at')
    .single()

  if (error) {
    throw error
  }

  return data as Challenge
}

export async function joinChallengeByInviteCode(params: {
  userId: string
  inviteCode: string
}) {
  const { data, error } = await supabase
    .from('challenges')
    .select('id, owner_id, title, invite_code, start_date, end_date, created_at')
    .eq('invite_code', params.inviteCode)
    .single()

  if (error || !data) {
    throw error ?? new Error('Challenge not found.')
  }

  const { error: memberError } = await supabase
    .from('challenge_members')
    .insert({ challenge_id: data.id, user_id: params.userId })

  if (memberError) {
    const code = (memberError as { code?: string }).code
    if (code !== '23505') {
      throw memberError
    }
  }

  return data as Challenge
}

export async function fetchChallengeMembers(challengeId: string) {
  const { data, error } = await supabase
    .from('challenge_members')
    .select('id, user_id, joined_at')
    .eq('challenge_id', challengeId)
    .order('joined_at', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []) as ChallengeMember[]
}

export async function fetchChallengeCheckins(challengeId: string) {
  const { data, error } = await supabase
    .from('challenge_checkins')
    .select('id, user_id, entry_date')
    .eq('challenge_id', challengeId)

  if (error) {
    throw error
  }

  return (data ?? []) as ChallengeCheckin[]
}

export async function upsertChallengeCheckins(params: {
  challengeId: string
  userId: string
  entryDates: string[]
}) {
  if (!params.entryDates.length) return

  const uniqueDates = Array.from(new Set(params.entryDates))
  const rows = uniqueDates.map(entryDate => ({
    challenge_id: params.challengeId,
    user_id: params.userId,
    entry_date: entryDate,
  }))

  const { error } = await supabase
    .from('challenge_checkins')
    .upsert(rows, { onConflict: 'challenge_id,user_id,entry_date' })

  if (error) {
    throw error
  }
}
