export const formatSleepHours = (value: number) => {
  if (!Number.isFinite(value)) return ''
  const wholeHours = Math.trunc(value)
  const minutes = Math.round((value - wholeHours) * 60)
  if (minutes === 0) return String(wholeHours)
  const adjustedHours = minutes === 60 ? wholeHours + 1 : wholeHours
  const adjustedMinutes = minutes === 60 ? 0 : minutes
  return `${adjustedHours}:${String(adjustedMinutes).padStart(2, '0')}`
}
