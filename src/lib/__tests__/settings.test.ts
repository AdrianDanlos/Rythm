import { describe, expect, it, beforeEach, vi } from 'vitest'
import { STORAGE_KEYS } from '../storageKeys'
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
    expect(getStoredDateFormat()).toBe('dmy')
    expect(getStoredTheme()).toBe('dark')
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
    window.localStorage.setItem(STORAGE_KEYS.DATE_FORMAT, 'invalid')
    window.localStorage.setItem(STORAGE_KEYS.THEME, 'invalid')

    expect(getStoredDateFormat()).toBe('dmy')
    expect(getStoredTheme()).toBe('dark')
  })

  it('handles storage failures safely', () => {
    const getItemSpy = vi.spyOn(window.localStorage, 'getItem')
      .mockImplementation(() => {
        throw new Error('storage failure')
      })

    expect(getStoredTheme()).toBe('dark')
    getItemSpy.mockRestore()
  })
})
