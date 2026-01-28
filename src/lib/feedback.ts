import { supabase } from './supabaseClient'

type FeedbackInput = {
  email: string
  message: string
  userId?: string | null
}

export const createFeedback = async ({
  email,
  message,
  userId,
}: FeedbackInput) => {
  const { error } = await supabase
    .from('feedback')
    .insert({
      email,
      message,
      user_id: userId ?? null,
    })

  if (error) {
    throw error
  }
}
