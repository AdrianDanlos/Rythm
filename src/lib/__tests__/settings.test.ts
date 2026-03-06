import { describe, expect, it, beforeEach, vi } from 'vitest'
import { STORAGE_KEYS } from '../storageKeys'
import {
  getStoredDateFormat,
  getStoredProfileName,
  getStoredTheme,
  getStoredThemePreference,
  setStoredDateFormat,
  setStoredProfileName,
  setStoredTheme,
} from '../settings'

describe('settings storage helpers', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('falls back to regional date format and system theme when storage is empty', () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, 'formatToParts').mockReturnValue(
      [
        { type: 'month', value: '11' },
        { type: 'literal', value: '/' },
        { type: 'day', value: '23' },
        { type: 'literal', value: '/' },
        { type: 'year', value: '2001' },
      ] as Intl.DateTimeFormatPart[],
    )
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      } as unknown as MediaQueryList),
    )

    expect(getStoredDateFormat()).toBe('mdy')
    expect(getStoredThemePreference()).toBeNull()
    expect(getStoredTheme()).toBe('light')
    expect(getStoredProfileName()).toBe('')
  })

  it('persists and reads values from storage', () => {
    setStoredDateFormat('dmy')
    setStoredTheme('dark')
    setStoredProfileName('Adrian')

    expect(getStoredDateFormat()).toBe('dmy')
    expect(getStoredTheme()).toBe('dark')
    expect(getStoredProfileName()).toBe('Adrian')
  })

  it('ignores invalid stored values', () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, 'formatToParts').mockReturnValue(
      [
        { type: 'day', value: '23' },
        { type: 'literal', value: '/' },
        { type: 'month', value: '11' },
        { type: 'literal', value: '/' },
        { type: 'year', value: '2001' },
      ] as Intl.DateTimeFormatPart[],
    )

    window.localStorage.setItem(STORAGE_KEYS.DATE_FORMAT, 'invalid')
    window.localStorage.setItem(STORAGE_KEYS.THEME, 'invalid')

    expect(getStoredDateFormat()).toBe('dmy')
    expect(getStoredThemePreference()).toBeNull()
  })

  it('detects year-month-day locale ordering', () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, 'formatToParts').mockReturnValue(
      [
        { type: 'year', value: '2001' },
        { type: 'literal', value: '/' },
        { type: 'month', value: '11' },
        { type: 'literal', value: '/' },
        { type: 'day', value: '23' },
      ] as Intl.DateTimeFormatPart[],
    )

    expect(getStoredDateFormat()).toBe('ymd')
  })

  it('handles storage failures safely', () => {
    const getItemSpy = vi.spyOn(window.localStorage, 'getItem')
      .mockImplementation(() => {
        throw new Error('storage failure')
      })

    expect(getStoredThemePreference()).toBeNull()
    expect(getStoredTheme()).toBe('dark')
    getItemSpy.mockRestore()
  })
})
