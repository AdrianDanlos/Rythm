import { jsPDF } from 'jspdf'
import type { Entry } from './entries'
import type { StatsResult } from './stats'
import { calculateAverages } from './utils/averages'
import { getCorrelationInsight } from './utils/correlation'
import { formatLongDate } from './utils/dateFormatters'
import { exportFile } from './utils/fileExport'
import { getSleepConsistencyLabel } from './utils/sleepConsistency'
import { buildTagInsights } from './utils/tagInsights'

type ReportOptions = {
  rangeDays?: number
  title?: string
  profileName?: string
}

export const exportMonthlyReport = async (
  entries: Entry[],
  stats: StatsResult,
  options: ReportOptions = {},
) => {
  const rangeDays = options.rangeDays ?? 30
  const title = options.title ?? 'Rythm Report'
  const welcomeName = options.profileName?.trim()
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

  const monthlyConsistency = getSleepConsistencyLabel(recentEntries)
  const monthlyCorrelation = getCorrelationInsight(recentEntries).label

  const monthlyTags = buildTagInsights(recentEntries, 5)
  const allTimeTags = buildTagInsights(entries, 5)

  const { sleep: avgSleep, mood: avgMood } = calculateAverages(recentEntries)
  const {
    sleep: priorAvgSleep,
    mood: priorAvgMood,
  } = calculateAverages(priorEntries)

  const bestDay = recentEntries.reduce<Entry | null>((best, entry) => {
    if (!best || Number(entry.mood) > Number(best.mood)) return entry
    return best
  }, null)

  const sleepDelta
    = avgSleep !== null && priorAvgSleep !== null ? avgSleep - priorAvgSleep : null
  const moodDelta
    = avgMood !== null && priorAvgMood !== null ? avgMood - priorAvgMood : null

  const doc = new jsPDF()
  let y = 18
  doc.setFontSize(18)
  doc.text(title, 14, y)
  y += 8

  if (welcomeName) {
    doc.setFontSize(12)
    doc.setTextColor(60)
    doc.text(`Welcome to your report ${welcomeName}`, 14, y)
    y += 7
  }

  doc.setFontSize(11)
  doc.setTextColor(80)
  doc.text(`${formatLongDate(start)} - ${formatLongDate(end)}`, 14, y)
  y += 10

  const drawSectionHeader = (label: string) => {
    doc.setFillColor(238, 242, 255)
    doc.rect(14, y - 5, 182, 9, 'F')
    doc.setTextColor(15)
    doc.setFontSize(13)
    doc.text(label, 16, y + 1)
    y += 12
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

  const drawLines = (lines: string[], indent = 18) => {
    doc.setFontSize(11)
    lines.forEach((line) => {
      doc.text(line, indent, y)
      y += 6
      if (y > 270) {
        doc.addPage()
        y = 18
      }
    })
    doc.setFontSize(12)
  }

  type SparkPoint = {
    x: number
    y: number
  }

  type WeekTotals = {
    count: number
    sleep: number
    mood: number
    sleeps: number[]
  }

  type MoodDip = {
    from: Entry
    to: Entry
    delta: number
  }

  const drawSparkline = (
    values: Array<number | null>,
    x: number,
    yStart: number,
    width: number,
    height: number,
    color: [number, number, number],
  ) => {
    const valid = values.filter((value): value is number => value !== null)
    if (valid.length < 2) return
    const min = Math.min(...valid)
    const max = Math.max(...valid)
    const span = max - min || 1
    const points = values
      .map((value, index) => {
        if (value === null) return null
        const px = x + (index / (values.length - 1)) * width
        const py = yStart + height - ((value - min) / span) * height
        return { x: px, y: py } satisfies SparkPoint
      })
      .filter((point): point is SparkPoint => point !== null)
    if (points.length < 2) return
    doc.setDrawColor(...color)
    doc.setLineWidth(0.6)
    for (let i = 1; i < points.length; i += 1) {
      const prev = points[i - 1]
      const next = points[i]
      doc.line(prev.x, prev.y, next.x, next.y)
    }
  }

  const calculateStdDev = (values: number[]) => {
    if (values.length < 2) return null
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length
    const variance = values.reduce(
      (sum, value) => sum + (value - mean) ** 2,
      0,
    ) / values.length
    return Math.sqrt(variance)
  }

  const weeklySummaries = (() => {
    if (!recentEntries.length) return []
    const sorted = [...recentEntries].sort((a, b) =>
      a.entry_date.localeCompare(b.entry_date),
    )
    const weekBuckets: Record<string, WeekTotals> = {}
    sorted.forEach((entry) => {
      const date = new Date(`${entry.entry_date}T00:00:00`)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      weekStart.setHours(0, 0, 0, 0)
      const key = weekStart.toISOString().slice(0, 10)
      if (!weekBuckets[key]) {
        weekBuckets[key] = { count: 0, sleep: 0, mood: 0, sleeps: [] }
      }
      const sleepValue = Number(entry.sleep_hours)
      if (Number.isFinite(sleepValue)) {
        weekBuckets[key].sleeps.push(sleepValue)
      }
      weekBuckets[key].count += 1
      weekBuckets[key].sleep += Number(entry.sleep_hours) || 0
      weekBuckets[key].mood += Number(entry.mood) || 0
    })
    return Object.entries(weekBuckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([startKey, totals]) => {
        const weekStart = new Date(`${startKey}T00:00:00`)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        const avgSleep = totals.count ? totals.sleep / totals.count : null
        const avgMood = totals.count ? totals.mood / totals.count : null
        const sleepStdDev = calculateStdDev(totals.sleeps)
        return {
          label: `${formatLongDate(weekStart)} - ${formatLongDate(weekEnd)}`,
          avgSleep,
          avgMood,
          sleepStdDev,
        }
      })
      .slice(-4)
  })()

  const bestNight = recentEntries.reduce<Entry | null>((best, entry) => {
    const sleepValue = Number(entry.sleep_hours)
    if (!Number.isFinite(sleepValue)) return best
    if (!best) return entry
    const bestSleepValue = Number(best.sleep_hours)
    if (!Number.isFinite(bestSleepValue)) return entry
    return sleepValue > bestSleepValue ? entry : best
  }, null)

  const biggestMoodDip = (() => {
    if (recentEntries.length < 2) return null
    const sorted = [...recentEntries].sort((a, b) =>
      a.entry_date.localeCompare(b.entry_date),
    )
    let dip: MoodDip | null = null
    for (let i = 1; i < sorted.length; i += 1) {
      const previous = sorted[i - 1]
      const current = sorted[i]
      const previousMood = Number(previous.mood)
      const currentMood = Number(current.mood)
      if (!Number.isFinite(previousMood) || !Number.isFinite(currentMood)) continue
      const delta = currentMood - previousMood
      if (delta < 0 && (!dip || Math.abs(delta) > Math.abs(dip.delta))) {
        dip = { from: previous, to: current, delta }
      }
    }
    return dip
  })()

  doc.setTextColor(20)
  drawSectionHeader('Last 30 days')

  if (recentEntries.length > 1) {
    const chartWidth = 182
    const chartHeight = 22
    doc.setFontSize(12)
    doc.text('Overview', 16, y)
    y += 5
    const sorted = [...recentEntries].sort((a, b) =>
      a.entry_date.localeCompare(b.entry_date),
    )
    const sleepSeries = sorted.map(entry =>
      entry.sleep_hours ? Number(entry.sleep_hours) : null,
    )
    const moodSeries = sorted.map(entry =>
      entry.mood ? Number(entry.mood) : null,
    )
    drawSparkline(sleepSeries, 14, y, chartWidth, chartHeight, [79, 70, 229])
    drawSparkline(moodSeries, 14, y, chartWidth, chartHeight, [14, 165, 233])
    const legendY = y + chartHeight + 6
    doc.setFontSize(10)
    doc.setTextColor(60)
    doc.setLineWidth(1.2)
    doc.setDrawColor(79, 70, 229)
    doc.line(16, legendY, 26, legendY)
    doc.text('Sleep', 30, legendY + 1)
    doc.setDrawColor(14, 165, 233)
    doc.line(60, legendY, 70, legendY)
    doc.text('Mood', 74, legendY + 1)
    doc.setTextColor(20)
    y += chartHeight + 18
  }

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
      `Best day: ${formatLongDate(new Date(`${bestDay.entry_date}T00:00:00`))}`,
    ])
    drawLines(
      [
        `Mood: ${bestDay.mood}`,
        `Sleep: ${bestDay.sleep_hours}h`,
        `Tags: ${bestTags}`,
      ],
      22,
    )
  }

  if (monthlyTags.length) {
    y += 4
    doc.setFontSize(12)
    doc.text('Top tags', 16, y)
    y += 6
    drawBullets(
      monthlyTags.map(
        tag =>
          `${tag.tag} · ${tag.count} entries · ${tag.mood?.toFixed(1) ?? '—'} mood`,
      ),
      18,
    )
  }

  if (weeklySummaries.length) {
    y += 6
    doc.setFontSize(12)
    doc.text('Weekly averages', 16, y)
    y += 7
    drawLines(
      weeklySummaries.map(
        week =>
          `${week.label} · Sleep ${
            week.avgSleep !== null ? week.avgSleep.toFixed(1) : '—'
          }h · Mood ${week.avgMood !== null ? week.avgMood.toFixed(1) : '—'}`,
      ),
      18,
    )
  }

  const highlightLines: string[] = []
  if (bestNight) {
    const sleepValue = Number(bestNight.sleep_hours)
    if (Number.isFinite(sleepValue)) {
      highlightLines.push(
        `Best night: ${formatLongDate(new Date(`${bestNight.entry_date}T00:00:00`))} (${sleepValue.toFixed(1)}h)`,
      )
    }
  }
  const mostConsistentWeek = weeklySummaries
    .filter(week => week.sleepStdDev !== null)
    .sort((a, b) => (a.sleepStdDev ?? 0) - (b.sleepStdDev ?? 0))[0]
  if (mostConsistentWeek?.sleepStdDev !== null) {
    highlightLines.push(
      `Most consistent week: ${mostConsistentWeek.label} (+/-${mostConsistentWeek.sleepStdDev.toFixed(1)}h)`,
    )
  }
  if (biggestMoodDip) {
    highlightLines.push(
      `Biggest mood dip: ${formatLongDate(new Date(`${biggestMoodDip.from.entry_date}T00:00:00`))} to ${formatLongDate(new Date(`${biggestMoodDip.to.entry_date}T00:00:00`))} (${biggestMoodDip.delta.toFixed(1)})`,
    )
  }
  if (highlightLines.length) {
    y += 6
    doc.setFontSize(12)
    doc.text('Highlights', 16, y)
    y += 7
    drawBullets(highlightLines.slice(0, 4), 18)
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

  const {
    sleep: allTimeAvgSleep,
    mood: allTimeAvgMood,
  } = calculateAverages(entries)

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
        tag =>
          `${tag.tag} · ${tag.count} entries · ${tag.mood?.toFixed(1) ?? '—'} mood`,
      ),
      18,
    )
  }

  y += 8

  const pdfBuffer = doc.output('arraybuffer') as ArrayBuffer
  await exportFile({
    filename: 'rythm-report.pdf',
    mimeType: 'application/pdf',
    data: pdfBuffer,
  })
}
