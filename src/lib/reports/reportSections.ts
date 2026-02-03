import type { jsPDF } from 'jspdf'
import type { Entry } from '../entries'
import type { StatsResult } from '../stats'
import { formatLongDate } from '../utils/dateFormatters'
import { formatSleepHours } from '../utils/sleepHours'
import type { ReportData } from './reportData'
import {
  drawBullets,
  drawLines,
  drawSectionHeader,
  drawSparkline,
} from './reportLayout'

type YRef = {
  value: number
}

type ReportHeaderParams = {
  doc: jsPDF
  yRef: YRef
  title: string
  welcomeName?: string
  start: Date
  end: Date
  brandImage?: HTMLImageElement
}

export const renderReportHeader = ({
  doc,
  yRef,
  title,
  welcomeName,
  start,
  end,
  brandImage,
}: ReportHeaderParams) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const bannerHeight = 20
  const bannerY = 0
  const logoSize = 12
  const logoX = 14
  const logoY = bannerY + (bannerHeight - logoSize) / 2

  doc.setFillColor(15, 23, 42)
  doc.rect(0, bannerY, pageWidth, bannerHeight, 'F')
  if (brandImage) {
    doc.addImage(brandImage, 'PNG', logoX, logoY, logoSize, logoSize)
  }
  const textX = logoX + logoSize + 6
  doc.setFontSize(9)
  doc.setTextColor(203, 213, 225)
  doc.text('Sleep & Mood', textX, bannerY + 7)
  doc.setFontSize(16)
  doc.setTextColor(255)
  doc.text('Rythm Report', textX, bannerY + 15)
  yRef.value = bannerY + bannerHeight + 10

  if (welcomeName) {
    doc.setFontSize(12)
    doc.setTextColor(60)
    doc.text(`Welcome to your report ${welcomeName}`, 14, yRef.value)
    yRef.value += 7
  }

  doc.setFontSize(11)
  doc.setTextColor(80)
  doc.text(`${formatLongDate(start)} - ${formatLongDate(end)}`, 14, yRef.value)
  yRef.value += 10
}

type Last30DaysParams = {
  doc: jsPDF
  yRef: YRef
  data: ReportData
}

export const renderLast30DaysSection = ({
  doc,
  yRef,
  data,
}: Last30DaysParams) => {
  yRef.value += 4
  const {
    recentEntries,
    monthlyConsistency,
    monthlyCorrelation,
    monthlyTags,
    avgSleep,
    avgMood,
    sleepDelta,
    moodDelta,
    bestDay,
    bestNight,
    biggestMoodDip,
    weeklySummaries,
  } = data

  doc.setTextColor(20)
  drawSectionHeader(doc, yRef, 'Last 30 days')

  if (recentEntries.length > 1) {
    const chartWidth = 182
    const chartHeight = 22
    doc.setFontSize(12)
    doc.text('Overview', 16, yRef.value)
    yRef.value += 5
    const sorted = [...recentEntries].sort((a, b) =>
      a.entry_date.localeCompare(b.entry_date),
    )
    const sleepSeries = sorted.map(entry =>
      entry.sleep_hours ? Number(entry.sleep_hours) : null,
    )
    const moodSeries = sorted.map(entry =>
      entry.mood ? Number(entry.mood) : null,
    )
    drawSparkline(doc, sleepSeries, 14, yRef.value, chartWidth, chartHeight, [79, 70, 229])
    drawSparkline(doc, moodSeries, 14, yRef.value, chartWidth, chartHeight, [14, 165, 233])
    const legendY = yRef.value + chartHeight + 6
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
    yRef.value += chartHeight + 18
  }

  drawBullets(doc, yRef, [
    `Entries logged: ${recentEntries.length}`,
    `Average sleep: ${avgSleep !== null ? formatSleepHours(avgSleep) : '—'}`,
    `Average mood: ${avgMood !== null ? avgMood.toFixed(1) : '—'} / 5`,
    `Sleep consistency: ${monthlyConsistency ?? '—'}`,
    `Sleep-mood link: ${monthlyCorrelation ?? '—'}`,
  ])

  if (bestDay) {
    const bestTags = bestDay.tags?.length ? bestDay.tags.join(', ') : '—'
    drawBullets(doc, yRef, [
      `Best day: ${formatLongDate(new Date(`${bestDay.entry_date}T00:00:00`))}`,
    ])
    drawLines(
      doc,
      yRef,
      [
        `Mood: ${bestDay.mood}`,
        `Sleep: ${formatSleepHours(Number(bestDay.sleep_hours))}`,
        `Tags: ${bestTags}`,
      ],
      22,
    )
  }

  if (monthlyTags.length) {
    yRef.value += 4
    doc.setFontSize(12)
    doc.text('Top tags', 16, yRef.value)
    yRef.value += 6
    drawBullets(
      doc,
      yRef,
      monthlyTags.map(
        tag =>
          `${tag.tag} · ${tag.count} entries · ${tag.mood?.toFixed(1) ?? '—'} mood`,
      ),
      18,
    )
  }

  if (weeklySummaries.length) {
    yRef.value += 6
    doc.setFontSize(12)
    doc.text('Weekly averages', 16, yRef.value)
    yRef.value += 7
    drawLines(
      doc,
      yRef,
      weeklySummaries.map(
        week =>
          `${week.label} · Sleep ${
            week.avgSleep !== null ? formatSleepHours(week.avgSleep) : '—'
          } · Mood ${week.avgMood !== null ? week.avgMood.toFixed(1) : '—'}`,
      ),
      18,
    )
  }

  const highlightLines: string[] = []
  if (bestNight) {
    const sleepValue = Number(bestNight.sleep_hours)
    if (Number.isFinite(sleepValue)) {
      highlightLines.push(
        `Best night: ${formatLongDate(new Date(`${bestNight.entry_date}T00:00:00`))} (${formatSleepHours(sleepValue)})`,
      )
    }
  }
  const mostConsistentWeek = weeklySummaries
    .filter(week => week.sleepStdDev !== null)
    .sort((a, b) => (a.sleepStdDev ?? 0) - (b.sleepStdDev ?? 0))[0]
  if (mostConsistentWeek?.sleepStdDev !== null) {
    highlightLines.push(
      `Most consistent week: ${mostConsistentWeek.label} (+/-${formatSleepHours(mostConsistentWeek.sleepStdDev)})`,
    )
  }
  if (biggestMoodDip) {
    highlightLines.push(
      `Biggest mood dip: ${formatLongDate(new Date(`${biggestMoodDip.from.entry_date}T00:00:00`))} to ${formatLongDate(new Date(`${biggestMoodDip.to.entry_date}T00:00:00`))} (${biggestMoodDip.delta.toFixed(1)})`,
    )
  }
  if (highlightLines.length) {
    yRef.value += 6
    doc.setFontSize(12)
    doc.text('Highlights', 16, yRef.value)
    yRef.value += 7
    drawBullets(doc, yRef, highlightLines.slice(0, 4), 18)
  }

  const summaryLines: string[] = []
  if (sleepDelta !== null) {
    summaryLines.push(
      sleepDelta >= 0
        ? `Sleep increased by ${formatSleepHours(sleepDelta)} vs prior 30 days.`
        : `Sleep decreased by ${formatSleepHours(Math.abs(sleepDelta))} vs prior 30 days.`,
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
    yRef.value += 4
    doc.setFontSize(12)
    doc.text('Summary', 16, yRef.value)
    yRef.value += 7
    drawBullets(doc, yRef, summaryLines.slice(0, 4), 18)
  }
}

type AllTimeParams = {
  doc: jsPDF
  yRef: YRef
  entries: Entry[]
  stats: StatsResult
  allTimeAvgSleep: number | null
  allTimeAvgMood: number | null
  allTimeTags: ReportData['allTimeTags']
}

export const renderAllTimeSection = ({
  doc,
  yRef,
  entries,
  stats,
  allTimeAvgSleep,
  allTimeAvgMood,
  allTimeTags,
}: AllTimeParams) => {
  yRef.value += 10
  doc.setFontSize(12)

  drawSectionHeader(doc, yRef, 'All time')

  drawBullets(doc, yRef, [
    `Entries logged: ${entries.length}`,
    `Average sleep: ${allTimeAvgSleep !== null ? formatSleepHours(allTimeAvgSleep) : '—'}`,
    `Average mood: ${allTimeAvgMood !== null ? allTimeAvgMood.toFixed(1) : '—'} / 5`,
    `Sleep consistency: ${stats.sleepConsistencyLabel ?? '—'}`,
    `Sleep-mood link: ${stats.correlationLabel ?? '—'}`,
  ])

  drawBullets(doc, yRef, [`Streak: ${stats.streak} days`])

  if (allTimeTags.length) {
    yRef.value += 4
    doc.setFontSize(12)
    doc.text('Top tags', 16, yRef.value)
    yRef.value += 6
    drawBullets(
      doc,
      yRef,
      allTimeTags.map(
        tag =>
          `${tag.tag} · ${tag.count} entries · ${tag.mood?.toFixed(1) ?? '—'} mood`,
      ),
      18,
    )
  }
}
