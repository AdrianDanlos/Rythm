import { describe, expect, it } from 'vitest'
import { getHighContrastTextColor } from '../colorContrast'

describe('getHighContrastTextColor', () => {
  it('returns black text for light backgrounds', () => {
    expect(getHighContrastTextColor('#facc15')).toBe('#000000')
  })

  it('returns white text for dark backgrounds', () => {
    expect(getHighContrastTextColor('#4f46e5')).toBe('#ffffff')
  })

  it('uses white on mid-tone and pastel fills', () => {
    expect(getHighContrastTextColor('#757575')).toBe('#ffffff')
    expect(getHighContrastTextColor('#767676')).toBe('#ffffff')
    expect(getHighContrastTextColor('#c4b5fd')).toBe('#ffffff')
  })

  it('returns undefined for invalid colors', () => {
    expect(getHighContrastTextColor(undefined)).toBeUndefined()
    expect(getHighContrastTextColor('#fff')).toBeUndefined()
    expect(getHighContrastTextColor('rgb(0,0,0)')).toBeUndefined()
    expect(getHighContrastTextColor('#GGGGGG')).toBeUndefined()
  })
})
