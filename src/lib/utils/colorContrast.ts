const hexColorPattern = /^#([0-9a-fA-F]{6})$/
const WHITE_BIAS_FACTOR = 1.02

const toLinearChannel = (channel: number): number => {
  const normalized = channel / 255
  if (normalized <= 0.03928) return normalized / 12.92
  return ((normalized + 0.055) / 1.055) ** 2.4
}

const relativeLuminance = (r: number, g: number, b: number): number => (
  0.2126 * toLinearChannel(r)
  + 0.7152 * toLinearChannel(g)
  + 0.0722 * toLinearChannel(b)
)

const contrastRatio = (l1: number, l2: number): number => {
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

const parseHexColor = (value: string): { r: number, g: number, b: number } | null => {
  const match = hexColorPattern.exec(value)
  if (!match) return null
  const hex = match[1]
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null
  return { r, g, b }
}

export const getHighContrastTextColor = (backgroundHex: string | undefined): string | undefined => {
  if (!backgroundHex) return undefined
  const parsed = parseHexColor(backgroundHex)
  if (!parsed) return undefined

  const bgLuminance = relativeLuminance(parsed.r, parsed.g, parsed.b)
  const blackContrast = contrastRatio(bgLuminance, 0)
  const whiteContrast = contrastRatio(bgLuminance, 1)

  return whiteContrast * WHITE_BIAS_FACTOR >= blackContrast ? '#ffffff' : '#000000'
}
