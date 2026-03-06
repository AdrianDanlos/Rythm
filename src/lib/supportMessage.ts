import { t } from 'i18next'

type SupportMessageInput = {
  sleepHours: number | null
  mood: number | null
  sleepThreshold: number
  tags?: string[]
}

/**
 * Returns a short, supportive message after logging based on completion state.
 */
export function getSupportMessage({
  sleepHours,
  mood,
  sleepThreshold,
  tags = [],
}: SupportMessageInput): string {
  if (sleepHours === null || mood === null) {
    if (sleepHours !== null) {
      return t('support.sleepSavedOneMoreTap')
    }
    if (mood !== null) {
      return t('support.moodSavedAddSleep')
    }
    return t('support.draftSaved')
  }

  const shortSleep = sleepHours < (sleepThreshold - 1)
  const goodMood = mood >= 4
  const lowMood = mood <= 2
  const tagSet = new Set(tags.map(t => t.trim().toLowerCase()))

  if (shortSleep && goodMood) {
    return t('support.shortSleepGoodMood')
  }
  if (shortSleep && !lowMood) {
    return t('support.shortSleepAware')
  }
  if (shortSleep && lowMood) {
    return t('support.shortSleepLowMood')
  }
  if (!shortSleep && goodMood) {
    return t('support.greatSleepGoodMood')
  }
  if (!shortSleep && lowMood) {
    return t('support.restButLowMood')
  }
  if (tagSet.has('exercise') && goodMood) {
    return t('support.exerciseGoodMood')
  }

  return t('support.loggedPatterns')
}
