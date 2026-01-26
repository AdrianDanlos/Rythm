import { jsPDF } from 'jspdf'
import type { Entry } from './entries'
import type { StatsResult } from './stats'

const formatDate = (date: Date) =>
  date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

type ReportOptions = {
  rangeDays?: number
  title?: string
}

export const exportMonthlyReport = (
  entries: Entry[],
  stats: StatsResult,
  options: ReportOptions = {},
) => {
  const rangeDays = options.rangeDays ?? 30
  const title = options.title ?? 'Rythm Report'
  const end = new Date()
  end.setHours(0, 0, 0, 0)
  const start = new Date(end)
  start.setDate(end.getDate() - (rangeDays - 1))

  const recentEntries = entries.filter((entry) => {
    const date = new Date(`${entry.entry_date}T00:00:00`)
    date.setHours(0, 0, 0, 0)
    return date >= start && date <= end
  })
  const priorStart = new Date(start)
  priorStart.setDate(start.getDate() - rangeDays)
  const priorEnd = new Date(start)
  priorEnd.setDate(start.getDate() - 1)
  const priorEntries = entries.filter((entry) => {
    const date = new Date(`${entry.entry_date}T00:00:00`)
    date.setHours(0, 0, 0, 0)
    return date >= priorStart && date <= priorEnd
  })

  const getSleepConsistencyLabel = (items: Entry[]) => {
    if (!items.length) return null
    const mean =
      items.reduce((sum, entry) => sum + Number(entry.sleep_hours), 0) /
      items.length
    const variance =
      items.reduce((sum, entry) => {
        const diff = Number(entry.sleep_hours) - mean
        return sum + diff * diff
      }, 0) / items.length
    const sleepConsistency = Math.sqrt(variance)
    if (sleepConsistency <= 0.9) return 'Very consistent'
    if (sleepConsistency <= 2.0) return 'Consistent'
    if (sleepConsistency <= 3.5) return 'Mixed'
    return 'Unstable'
  }

  const getCorrelationLabel = (items: Entry[]) => {
    if (items.length < 2) return null
    const meanSleep =
      items.reduce((sum, entry) => sum + Number(entry.sleep_hours), 0) /
      items.length
    const meanMood =
      items.reduce((sum, entry) => sum + Number(entry.mood), 0) / items.length

    let numerator = 0
    let sumSleep = 0
    let sumMood = 0

    items.forEach((entry) => {
      const sleepDelta = Number(entry.sleep_hours) - meanSleep
      const moodDelta = Number(entry.mood) - meanMood
      numerator += sleepDelta * moodDelta
      sumSleep += sleepDelta * sleepDelta
      sumMood += moodDelta * moodDelta
    })

    const denominator = Math.sqrt(sumSleep * sumMood)
    if (denominator === 0) return null

    const correlation = numerator / denominator
    const magnitude = Math.abs(correlation)
    if (magnitude < 0.2) return 'No clear'
    if (magnitude < 0.4) return 'Weak'
    if (magnitude < 0.7) return 'Moderate'
    return 'Strong'
  }

  const monthlyConsistency = getSleepConsistencyLabel(recentEntries)
  const monthlyCorrelation = getCorrelationLabel(recentEntries)

  const buildTagInsights = (items: Entry[]) => {
    const aggregates = new Map<
      string,
      { sleepSum: number; moodSum: number; count: number }
    >()
    items.forEach((entry) => {
      const tags = entry.tags ?? []
      tags.forEach((tag) => {
        const key = tag.trim()
        if (!key) return
        const current = aggregates.get(key) ?? {
          sleepSum: 0,
          moodSum: 0,
          count: 0,
        }
        current.sleepSum += Number(entry.sleep_hours)
        current.moodSum += Number(entry.mood)
        current.count += 1
        aggregates.set(key, current)
      })
    })
    return Array.from(aggregates.entries())
      .map(([tag, data]) => ({
        tag,
        sleep: data.count ? data.sleepSum / data.count : null,
        mood: data.count ? data.moodSum / data.count : null,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  const monthlyTags = buildTagInsights(recentEntries)
  const allTimeTags = buildTagInsights(entries)

  const avgSleep = recentEntries.length
    ? recentEntries.reduce(
        (sum, entry) => sum + Number(entry.sleep_hours),
        0,
      ) / recentEntries.length
    : null
  const avgMood = recentEntries.length
    ? recentEntries.reduce((sum, entry) => sum + Number(entry.mood), 0) /
      recentEntries.length
    : null

  const priorAvgSleep = priorEntries.length
    ? priorEntries.reduce((sum, entry) => sum + Number(entry.sleep_hours), 0) /
      priorEntries.length
    : null
  const priorAvgMood = priorEntries.length
    ? priorEntries.reduce((sum, entry) => sum + Number(entry.mood), 0) /
      priorEntries.length
    : null

  const bestDay = recentEntries.reduce<Entry | null>((best, entry) => {
    if (!best || Number(entry.mood) > Number(best.mood)) return entry
    return best
  }, null)

  const sleepDelta =
    avgSleep !== null && priorAvgSleep !== null ? avgSleep - priorAvgSleep : null
  const moodDelta =
    avgMood !== null && priorAvgMood !== null ? avgMood - priorAvgMood : null

  const doc = new jsPDF()
  let y = 18
  doc.setFontSize(18)
  doc.text(title, 14, y)
  y += 8

  doc.setFontSize(11)
  doc.setTextColor(80)
  doc.text(`${formatDate(start)} - ${formatDate(end)}`, 14, y)
  y += 10

  const drawSectionHeader = (label: string) => {
    doc.setFillColor(238, 242, 255)
    doc.rect(14, y - 5, 182, 9, 'F')
    doc.setTextColor(15)
    doc.setFontSize(13)
    doc.text(label, 16, y + 1)
    y += 14
  }

  const drawBullets = (lines: string[], indent = 16) => {
    doc.setFontSize(11)
    lines.forEach((line) => {
      doc.text(`• ${line}`, indent, y)
      y += 6
      if (y > 270) {
        doc.addPage()
        y = 18
      }
    })
    doc.setFontSize(12)
  }

  doc.setTextColor(20)
  drawSectionHeader('Last 30 days')

  drawBullets([
    `Entries logged: ${recentEntries.length}`,
    `Average sleep: ${avgSleep !== null ? avgSleep.toFixed(1) : '—'} hrs`,
    `Average mood: ${avgMood !== null ? avgMood.toFixed(1) : '—'} / 5`,
    `Sleep consistency: ${monthlyConsistency ?? '—'}`,
    `Sleep-mood link: ${monthlyCorrelation ?? '—'}`,
  ])

  if (bestDay) {
    const bestTags = bestDay.tags?.length ? bestDay.tags.join(', ') : '—'
    drawBullets([
      `Best day: ${bestDay.entry_date} · Mood ${bestDay.mood} · Sleep ${bestDay.sleep_hours}h · Tags: ${bestTags}`,
    ])
  }

  if (monthlyTags.length) {
    y += 4
    doc.setFontSize(12)
    doc.text('Top tags', 16, y)
    y += 6
    drawBullets(
      monthlyTags.map(
        (tag) =>
          `${tag.tag} · ${tag.count} entries · ${tag.mood?.toFixed(1) ?? '—'} mood`,
      ),
      18,
    )
  }

  const summaryLines: string[] = []
  if (sleepDelta !== null) {
    summaryLines.push(
      sleepDelta >= 0
        ? `Sleep increased by ${sleepDelta.toFixed(1)} hours vs prior 30 days.`
        : `Sleep decreased by ${Math.abs(sleepDelta).toFixed(1)} hours vs prior 30 days.`,
    )
  }
  if (moodDelta !== null) {
    summaryLines.push(
      moodDelta >= 0
        ? `Mood improved by ${moodDelta.toFixed(1)} points vs prior 30 days.`
        : `Mood dropped by ${Math.abs(moodDelta).toFixed(1)} points vs prior 30 days.`,
    )
  }

  if (summaryLines.length) {
    y += 4
    doc.setFontSize(12)
    doc.text('Summary', 16, y)
    y += 7
    drawBullets(summaryLines.slice(0, 4), 18)
  }

  y += 10
  doc.setFontSize(12)

  const allTimeAvgSleep = entries.length
    ? entries.reduce((sum, entry) => sum + Number(entry.sleep_hours), 0) /
      entries.length
    : null
  const allTimeAvgMood = entries.length
    ? entries.reduce((sum, entry) => sum + Number(entry.mood), 0) / entries.length
    : null

  drawSectionHeader('All time')

  drawBullets([
    `Entries logged: ${entries.length}`,
    `Average sleep: ${
      allTimeAvgSleep !== null ? allTimeAvgSleep.toFixed(1) : '—'
    } hrs`,
    `Average mood: ${
      allTimeAvgMood !== null ? allTimeAvgMood.toFixed(1) : '—'
    } / 5`,
    `Sleep consistency: ${stats.sleepConsistencyLabel ?? '—'}`,
    `Sleep-mood link: ${stats.correlationLabel ?? '—'}`,
  ])

  drawBullets([`Streak: ${stats.streak} days`])

  if (allTimeTags.length) {
    y += 4
    doc.setFontSize(12)
    doc.text('Top tags', 16, y)
    y += 6
    drawBullets(
      allTimeTags.map(
        (tag) =>
          `${tag.tag} · ${tag.count} entries · ${tag.mood?.toFixed(1) ?? '—'} mood`,
      ),
      18,
    )
  }

  y += 8

  doc.save('rythm-report.pdf')
}
