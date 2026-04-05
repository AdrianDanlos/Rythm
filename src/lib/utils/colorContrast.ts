const hexColorPattern = /^#([0-9a-fA-F]{6})$/

/** Black text only on clearly light fills; saturated / mid-tone pills stay white. */
const LIGHT_BACKGROUND_LUMINANCE = 0.62

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
  return bgLuminance >= LIGHT_BACKGROUND_LUMINANCE ? '#000000' : '#ffffff'
}
