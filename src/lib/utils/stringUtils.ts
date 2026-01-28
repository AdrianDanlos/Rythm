export const parseTags = (value: string) =>
  value
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag.length)

export const escapeCsv = (value: string | number | null) => {
  const stringValue = value === null ? '' : String(value)
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}
