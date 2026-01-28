import { supabase } from './supabaseClient'

type FeedbackInput = {
  message: string
}

export const createFeedback = async ({
  message,
}: FeedbackInput) => {
  const { error } = await supabase.functions.invoke('submit-feedback', {
    body: { message },
  })

  if (error) {
    throw error
  }
}
