import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  getStoredDateFormat,
  getStoredProfileName,
  getStoredTheme,
  setStoredDateFormat,
  setStoredProfileName,
  setStoredTheme,
} from '../settings'

describe('settings storage helpers', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('falls back to defaults when storage is empty', () => {
    expect(getStoredDateFormat()).toBe('mdy')
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
    window.localStorage.setItem('preferredDateFormat', 'invalid')
    window.localStorage.setItem('themePreference', 'invalid')

    expect(getStoredDateFormat()).toBe('mdy')
    expect(getStoredTheme()).toBe('light')
  })

  it('handles storage failures safely', () => {
    const getItemSpy = vi.spyOn(window.localStorage, 'getItem')
      .mockImplementation(() => {
        throw new Error('storage failure')
      })

    expect(getStoredTheme()).toBe('light')
    getItemSpy.mockRestore()
  })
})
