/** Hours shown in the log form when sleep hasn’t been set; also saved on submit if still unset. */
export const DEFAULT_LOG_SLEEP_HOURS = 8

/**
 * Parse a variety of human-friendly sleep hour inputs into a numeric value.
 *
 * Supported formats (examples):
 * - "7" / "7.5"
 * - "7:30"
 * - "7h" / "7 h" / "7h 30m" / "7h30min"
 */
export const parseSleepHours = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (trimmed.includes(':')) {
    const match = /^(\d{1,2})\s*:\s*(\d{1,2})$/.exec(trimmed)
    if (!match) return null
    const hours = Number(match[1])
    const minutes = Number(match[2])
    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || minutes >= 60) {
      return null
    }
    return hours + minutes / 60
  }

  if (/[hH]/.test(trimmed)) {
    const match = /^(\d{1,2})\s*h(?:\s*(\d{1,2})\s*(?:m|min)?)?$/i.exec(trimmed)
    if (!match) return null
    const hours = Number(match[1])
    const minutes = match[2] ? Number(match[2]) : 0
    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || minutes >= 60) {
      return null
    }
    return hours + minutes / 60
  }

  const asNumber = Number(trimmed)
  if (!Number.isFinite(asNumber)) return null
  return asNumber
}

export const formatSleepHoursOption = (value: number) => {
  const rounded = Math.round(value * 4) / 4
  return rounded.toFixed(2).replace(/\.?0+$/, '')
}

export const formatSleepHours = (value: number) => {
  if (!Number.isFinite(value)) return ''
  const totalMinutes = Math.round(value * 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}
