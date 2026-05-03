import { describe, expect, it } from 'vitest'
import { formatSleepHoursOption, parseSleepHours } from '../sleepHours'

describe('formatSleepHoursOption', () => {
  it('preserves non–quarter-hour minutes (e.g. 7:05) when loading from storage', () => {
    const sevenOhFiveHours = 7 + 5 / 60
    const formatted = formatSleepHoursOption(sevenOhFiveHours)
    expect(formatted).not.toBe('7')
    const asNumber = parseSleepHours(formatted)
    expect(asNumber).not.toBeNull()
    expect(Math.round((asNumber as number) * 60)).toBe(7 * 60 + 5)
  })

  it('still trims whole hours without stray decimals', () => {
    expect(formatSleepHoursOption(8)).toBe('8')
  })
})
