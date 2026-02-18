type SupportMessageInput = {
  sleepHours: number | null
  mood: number | null
  sleepThreshold: number
  tags?: string[]
  isComplete: boolean
}

/**
 * Returns a short, supportive message after logging based on completion state.
 */
export function getSupportMessage({
  sleepHours,
  mood,
  sleepThreshold,
  tags = [],
  isComplete,
}: SupportMessageInput): string {
  if (!isComplete) {
    if (sleepHours !== null && mood === null) {
      return 'Sleep saved. One more tap to add mood and you\'re done — you\'ve got this.'
    }
    if (sleepHours === null && mood !== null) {
      return 'Mood saved. Add sleep when you can and you\'ll have a complete picture.'
    }
    return 'Draft saved. Come back anytime — every little step counts.'
  }

  if (sleepHours === null || mood === null) {
    return 'Logged. You\'re building a clearer picture of your rhythm — keep going.'
  }

  const shortSleep = sleepHours < (sleepThreshold - 1)
  const goodMood = mood >= 4
  const lowMood = mood <= 2
  const tagSet = new Set(tags.map(t => t.trim().toLowerCase()))

  if (shortSleep && goodMood) {
    return 'Short on sleep but still in good spirits — that\'s real resilience.'
  }
  if (shortSleep && !lowMood) {
    return 'You\'re aware of your sleep — that\'s the first step. Tonight\'s a fresh chance to rest.'
  }
  if (shortSleep && lowMood) {
    return 'Tough combo today. You showed up and logged it — that takes strength. Tomorrow’s a new day.'
  }
  if (!shortSleep && goodMood) {
    return 'Great sleep and a good mood — you\'re in a strong place today.'
  }
  if (!shortSleep && lowMood) {
    return 'You gave your body good rest. Be kind to yourself — some days are just harder.'
  }
  if (tagSet.has('exercise') && goodMood) {
    return 'Excercise and a good mood — you\'re seeing the connection. Keep it up.'
  }

  return 'Logged. Every entry brings you closer to understanding your patterns.'
}
