/**
 * Returns a short, supportive message after logging based on sleep, mood, and optional tags.
 * Used for post-save toast to make the app feel more personal.
 */
export function getSupportMessage(
  sleepHours: number,
  mood: number,
  sleepThreshold: number,
  tags: string[] = [],
): string {
  const shortSleep = sleepHours < sleepThreshold
  const goodMood = mood >= 4
  const lowMood = mood <= 2
  const tagSet = new Set(tags.map(t => t.trim().toLowerCase()))

  if (shortSleep && goodMood) {
    return 'Even after a brief night, you are moving through the day in good spirits!'
  }
  if (shortSleep && !lowMood) {
    return 'Sleep was under your target. Rest well tonight when you can.'
  }
  if (shortSleep && lowMood) {
    return 'Rough combo today. Logging it is a good step — tomorrow’s a new day.'
  }
  if (!shortSleep && goodMood) {
    return 'Solid sleep and a good mood — nice combo!'
  }
  if (!shortSleep && lowMood) {
    return 'You got decent sleep. If today still felt tough, be gentle with yourself.'
  }
  if (tagSet.has('exercise') && goodMood) {
    return 'Exercise and a good mood — nice to see that link!'
  }
  if (tagSet.has('caffeine') && shortSleep) {
    return 'Noted. Caffeine and sleep can be tricky — worth watching in your insights.'
  }

  return 'Entry saved. Every log helps you see your patterns over time.'
}
