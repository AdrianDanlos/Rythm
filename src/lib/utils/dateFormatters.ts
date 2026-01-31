import { getStoredDateFormat } from '../settings'

export const getDateLocale = () => {
  const preference = getStoredDateFormat()
  if (preference === 'dmy') return 'en-GB'
  if (preference === 'ymd') return 'en-CA'
  return 'en-US'
}

export const formatLocalDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatPreferredDate = (date: Date, includeYear: boolean) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const preference = getStoredDateFormat()

  if (preference === 'dmy') {
    return includeYear ? `${day}/${month}/${year}` : `${day}/${month}`
  }
  if (preference === 'ymd') {
    return includeYear ? `${year}/${month}/${day}` : `${month}/${day}`
  }
  return includeYear ? `${month}/${day}/${year}` : `${month}/${day}`
}

export const formatShortDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return formatPreferredDate(date, false)
}

export const formatLongDate = (date: Date) => {
  return formatPreferredDate(date, true)
}
