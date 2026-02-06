import type { RollingPoint, TrendPoint } from './types/stats'

function hasTrendData(p: TrendPoint): boolean {
  return p.sleep !== null || p.mood !== null
}

function hasRollingData(p: RollingPoint): boolean {
  return (
    p.sleep7 !== null ||
    p.sleep30 !== null ||
    p.sleep90 !== null ||
    p.mood7 !== null ||
    p.mood30 !== null ||
    p.mood90 !== null
  )
}

/**
 * Trim trend points to the extent of actual data (first to last non-null).
 * Keeps the selected range (30/90/365) intact; only removes leading/trailing empty days
 * so the chart uses full width for the days that have data.
 */
export function trimToDataExtentTrend(points: TrendPoint[]): TrendPoint[] {
  if (!points.length) return []
  let first = -1
  let last = -1
  for (let i = 0; i < points.length; i++) {
    if (hasTrendData(points[i])) {
      if (first < 0) first = i
      last = i
    }
  }
  if (first < 0 || last < 0) return []
  return points.slice(first, last + 1)
}

/**
 * Trim rolling points to the extent of actual data (first to last non-null).
 * So the chart uses full width for the days that have rolling values.
 */
export function trimToDataExtentRolling(points: RollingPoint[]): RollingPoint[] {
  if (!points.length) return []
  let first = -1
  let last = -1
  for (let i = 0; i < points.length; i++) {
    if (hasRollingData(points[i])) {
      if (first < 0) first = i
      last = i
    }
  }
  if (first < 0 || last < 0) return []
  return points.slice(first, last + 1)
}
