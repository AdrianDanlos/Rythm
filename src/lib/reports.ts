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
}

export const exportMonthlyReport = async (
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
