import { t } from 'i18next'

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
      return t('support.sleepSavedOneMoreTap', 'Sleep saved. One more tap to add mood and you are done — you have got this.')
    }
    if (sleepHours === null && mood !== null) {
      return t('support.moodSavedAddSleep', 'Mood saved. Add sleep when you can and you will have a complete picture.')
    }
    return t('support.draftSaved', 'Draft saved. Come back anytime — every little step counts.')
  }

  if (sleepHours === null || mood === null) {
    return t('support.loggedKeepGoing', 'Logged. You are building a clearer picture of your rhythm — keep going.')
  }

  const shortSleep = sleepHours < (sleepThreshold - 1)
  const goodMood = mood >= 4
  const lowMood = mood <= 2
  const tagSet = new Set(tags.map(t => t.trim().toLowerCase()))

  if (shortSleep && goodMood) {
    return t('support.shortSleepGoodMood', 'Short on sleep but still in good spirits — that is real resilience.')
  }
  if (shortSleep && !lowMood) {
    return t('support.shortSleepAware', 'You are aware of your sleep — that is the first step. Tonight is a fresh chance to rest.')
  }
  if (shortSleep && lowMood) {
    return t('support.shortSleepLowMood', 'Tough combo today. You showed up and logged it — that takes strength. Tomorrow is a new day.')
  }
  if (!shortSleep && goodMood) {
    return t('support.greatSleepGoodMood', 'Great sleep and a good mood — you are in a strong place today.')
  }
  if (!shortSleep && lowMood) {
    return t('support.restButLowMood', 'You gave your body good rest. Be kind to yourself — some days are just harder.')
  }
  if (tagSet.has('exercise') && goodMood) {
    return t('support.exerciseGoodMood', 'Exercise and a good mood — you are seeing the connection. Keep it up.')
  }

  return t('support.loggedPatterns', 'Logged. Every entry brings you closer to understanding your patterns.')
}
