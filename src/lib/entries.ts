import { supabase } from './supabaseClient'

export type Entry = {
  id: string
  user_id: string
  entry_date: string
  sleep_hours: number | null
  mood: number | null
  note: string | null
  tags: string[] | null
  is_complete: boolean
  completed_at: string | null
  created_at: string
}

export type EntryInput = {
  user_id: string
  entry_date: string
  sleep_hours?: number | null
  mood?: number | null
  note?: string | null
  tags?: string[] | null
  is_complete?: boolean
  completed_at?: string | null
}

export async function fetchEntries(userId: string) {
  const { data, error } = await supabase
    .from('entries')
    .select('id, user_id, entry_date, sleep_hours, mood, note, tags, is_complete, completed_at, created_at')
    .eq('user_id', userId)
    .order('entry_date', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function upsertEntry(entry: EntryInput) {
  const { data, error } = await supabase
    .from('entries')
    .upsert(entry, { onConflict: 'user_id,entry_date' })
    .select('id, user_id, entry_date, sleep_hours, mood, note, tags, is_complete, completed_at, created_at')
    .single()

  if (error) {
    throw error
  }

  return data
}
