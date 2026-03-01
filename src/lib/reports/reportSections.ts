import type { jsPDF } from 'jspdf'
import { t } from 'i18next'
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
  startNewPage,
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
  const marginLeft = 14
  // Match app nav (dark theme): column layout (eyebrow on top, logo below), dark bar, logo 100×34 proportion
  const logoHeight = 10
  const logoWidth = (100 / 34) * logoHeight
  const eyebrowBaseline = 5
  const gap = 2
  const logoY = eyebrowBaseline + gap
  const bannerHeight = logoY + logoHeight + 4
  const bannerY = 0

  doc.setFillColor(17, 24, 39)
  doc.rect(0, bannerY, pageWidth, bannerHeight, 'F')
  doc.setDrawColor(31, 41, 55)
  doc.setLineWidth(0.3)
  doc.line(0, bannerY + bannerHeight, pageWidth, bannerY + bannerHeight)

  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text(t('reports.reportLogoLabel'), marginLeft, eyebrowBaseline)

  if (brandImage) {
    doc.addImage(brandImage, 'PNG', marginLeft, logoY, logoWidth, logoHeight)
  }

  yRef.value = bannerY + bannerHeight + 10

  doc.setFontSize(18)
  doc.setTextColor(15, 23, 42)
  doc.text(title, marginLeft, yRef.value)
  yRef.value += 8

  if (welcomeName) {
    doc.setFontSize(12)
    doc.setTextColor(100, 116, 139)
    doc.text(t('reports.welcomeReport', { name: welcomeName }), marginLeft, yRef.value)
    yRef.value += 7
  }

  doc.setFontSize(11)
  doc.setTextColor(80)
  doc.text(`${formatLongDate(start)} - ${formatLongDate(end)}`, marginLeft, yRef.value)
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
  drawSectionHeader(doc, yRef, t('reports.last30Days'))

  if (recentEntries.length > 1) {
    const chartWidth = 182
    const chartHeight = 22
    doc.setFontSize(12)
    doc.text(t('reports.overview'), 16, yRef.value)
    yRef.value += 5
    const sorted = [...recentEntries].sort((a, b) =>
      a.entry_date.localeCompare(b.entry_date),
    )
    const sleepSeries = sorted.map(entry =>
      entry.sleep_hours === null ? null : Number(entry.sleep_hours),
    )
    const moodSeries = sorted.map(entry =>
      entry.mood === null ? null : Number(entry.mood),
    )
    drawSparkline(doc, sleepSeries, 14, yRef.value, chartWidth, chartHeight, [79, 70, 229])
    drawSparkline(doc, moodSeries, 14, yRef.value, chartWidth, chartHeight, [14, 165, 233])
    const legendY = yRef.value + chartHeight + 6
    doc.setFontSize(10)
    doc.setTextColor(60)
    doc.setLineWidth(1.2)
    doc.setDrawColor(79, 70, 229)
    doc.line(16, legendY, 26, legendY)
    doc.text(t('common.sleep'), 30, legendY + 1)
    doc.setDrawColor(14, 165, 233)
    doc.line(60, legendY, 70, legendY)
    doc.text(t('common.mood'), 74, legendY + 1)
    doc.setTextColor(20)
    yRef.value += chartHeight + 18
  }

  drawBullets(doc, yRef, [
    t('reports.entriesLogged', { count: recentEntries.length }),
    t('reports.averageSleep', { value: avgSleep !== null ? formatSleepHours(avgSleep) : '—' }),
    t('reports.averageMood', { value: avgMood !== null ? avgMood.toFixed(1) : '—' }),
    t('reports.sleepConsistency', { value: monthlyConsistency ? t(`insights.sleepConsistencyLevels.${monthlyConsistency}`) : '—' }),
    t('reports.sleepMoodLink', { value: monthlyCorrelation ? t(`insights.correlationLevels.${monthlyCorrelation}`) : '—' }),
  ])

  if (bestDay) {
    const bestTags = bestDay.tags?.length ? bestDay.tags.join(', ') : '—'
    drawBullets(doc, yRef, [
      t('reports.bestDay', { date: formatLongDate(new Date(`${bestDay.entry_date}T00:00:00`)) }),
    ])
    drawLines(
      doc,
      yRef,
      [
        t('reports.moodValue', { value: bestDay.mood !== null ? bestDay.mood : '—' }),
        t('reports.sleepValue', { value: bestDay.sleep_hours !== null ? formatSleepHours(Number(bestDay.sleep_hours)) : '—' }),
        t('reports.dailyEventsValue', { value: bestTags }),
      ],
      22,
    )
  }

  if (weeklySummaries.length) {
    yRef.value += 6
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(t('reports.weeklyAverages'), 16, yRef.value)
    doc.setFont('helvetica', 'normal')
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
        t('reports.bestNight', {
          date: formatLongDate(new Date(`${bestNight.entry_date}T00:00:00`)),
          value: formatSleepHours(sleepValue),
        }),
      )
    }
  }
  const mostConsistentWeek = weeklySummaries
    .filter(week => week.sleepStdDev !== null)
    .sort((a, b) => (a.sleepStdDev ?? 0) - (b.sleepStdDev ?? 0))[0]
  if (mostConsistentWeek?.sleepStdDev !== null) {
    highlightLines.push(
      t('reports.mostConsistentWeek', {
        label: mostConsistentWeek.label,
        value: formatSleepHours(mostConsistentWeek.sleepStdDev),
      }),
    )
  }
  if (biggestMoodDip) {
    highlightLines.push(
      t('reports.biggestMoodDip', {
        from: formatLongDate(new Date(`${biggestMoodDip.from.entry_date}T00:00:00`)),
        to: formatLongDate(new Date(`${biggestMoodDip.to.entry_date}T00:00:00`)),
        delta: biggestMoodDip.delta.toFixed(1),
      }),
    )
  }
  if (highlightLines.length) {
    yRef.value += 6
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(t('reports.highlights'), 16, yRef.value)
    doc.setFont('helvetica', 'normal')
    yRef.value += 7
    drawBullets(doc, yRef, highlightLines.slice(0, 4), 18)
  }

  const summaryLines: string[] = []
  if (sleepDelta !== null) {
    summaryLines.push(
      sleepDelta >= 0
        ? t('reports.sleepIncreased', { value: formatSleepHours(sleepDelta) })
        : t('reports.sleepDecreased', { value: formatSleepHours(Math.abs(sleepDelta)) }),
    )
  }
  if (moodDelta !== null) {
    summaryLines.push(
      moodDelta >= 0
        ? t('reports.moodImproved', { value: moodDelta.toFixed(1) })
        : t('reports.moodDropped', { value: Math.abs(moodDelta).toFixed(1) }),
    )
  }

  if (summaryLines.length) {
    yRef.value += 4
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(t('reports.summary'), 16, yRef.value)
    doc.setFont('helvetica', 'normal')
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
  allTimeTagDrivers: ReportData['allTimeTagDrivers']
  allTimeTagSleepDrivers: ReportData['allTimeTagSleepDrivers']
}

export const renderAllTimeSection = ({
  doc,
  yRef,
  entries,
  stats,
  allTimeAvgSleep,
  allTimeAvgMood,
  allTimeTags,
  allTimeTagDrivers,
  allTimeTagSleepDrivers,
}: AllTimeParams) => {
  startNewPage(doc, yRef)
  doc.setFontSize(12)

  drawSectionHeader(doc, yRef, t('reports.allTime'))

  drawBullets(doc, yRef, [
    t('reports.entriesLogged', { count: entries.length }),
    t('reports.averageSleep', { value: allTimeAvgSleep !== null ? formatSleepHours(allTimeAvgSleep) : '—' }),
    t('reports.averageMood', { value: allTimeAvgMood !== null ? allTimeAvgMood.toFixed(1) : '—' }),
    t('reports.sleepConsistency', { value: stats.sleepConsistencyLabel ? t(`insights.sleepConsistencyLevels.${stats.sleepConsistencyLabel}`) : '—' }),
    t('reports.sleepMoodLink', { value: stats.correlationLabel ? t(`insights.correlationLevels.${stats.correlationLabel}`) : '—' }),
  ])

  drawBullets(doc, yRef, [t('reports.streakValue', {
    count: stats.streak,
    unit: stats.streak === 1 ? t('common.day') : t('common.days'),
  })])

  const moodPos = allTimeTagDrivers.filter(d => (d.delta ?? 0) > 0).sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0)).slice(0, 4)
  const moodNeg = allTimeTagDrivers.filter(d => (d.delta ?? 0) < 0).sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0)).slice(0, 4)
  const sleepPos = allTimeTagSleepDrivers.filter(d => (d.delta ?? 0) > 0).sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0)).slice(0, 4)
  const sleepNeg = allTimeTagSleepDrivers.filter(d => (d.delta ?? 0) < 0).sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0)).slice(0, 4)

  if (moodPos.length > 0 || moodNeg.length > 0) {
    yRef.value += 4
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(t('reports.eventsPredictMood'), 16, yRef.value)
    doc.setFont('helvetica', 'normal')
    yRef.value += 6
    if (moodPos.length > 0) {
      doc.setFontSize(10)
      doc.setTextColor(60)
      doc.text(t('reports.top4Positive'), 18, yRef.value)
      yRef.value += 5
      doc.setTextColor(20)
      drawBullets(
        doc,
        yRef,
        moodPos.map(d => t('reports.moodDeltaLine', { tag: d.tag, delta: `+${(d.delta ?? 0).toFixed(1)}` })),
        20,
      )
      yRef.value += 2
    }
    if (moodNeg.length > 0) {
      doc.setFontSize(10)
      doc.setTextColor(60)
      doc.text(t('reports.top4Negative'), 18, yRef.value)
      yRef.value += 5
      doc.setTextColor(20)
      drawBullets(
        doc,
        yRef,
        moodNeg.map(d => t('reports.moodDeltaLine', { tag: d.tag, delta: (d.delta ?? 0).toFixed(1) })),
        20,
      )
      yRef.value += 2
    }
    doc.setFontSize(12)
  }

  if (sleepPos.length > 0 || sleepNeg.length > 0) {
    yRef.value += 4
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(t('reports.eventsPredictSleep'), 16, yRef.value)
    doc.setFont('helvetica', 'normal')
    yRef.value += 6
    if (sleepPos.length > 0) {
      doc.setFontSize(10)
      doc.setTextColor(60)
      doc.text(t('reports.top4Positive'), 18, yRef.value)
      yRef.value += 5
      doc.setTextColor(20)
      drawBullets(
        doc,
        yRef,
        sleepPos.map(d => t('reports.sleepDeltaLine', { tag: d.tag, delta: `+${(d.delta ?? 0).toFixed(1)}` })),
        20,
      )
      yRef.value += 2
    }
    if (sleepNeg.length > 0) {
      doc.setFontSize(10)
      doc.setTextColor(60)
      doc.text(t('reports.top4Negative'), 18, yRef.value)
      yRef.value += 5
      doc.setTextColor(20)
      drawBullets(
        doc,
        yRef,
        sleepNeg.map(d => t('reports.sleepDeltaLine', { tag: d.tag, delta: (d.delta ?? 0).toFixed(1) })),
        20,
      )
      yRef.value += 2
    }
    doc.setFontSize(12)
  }

  if (allTimeTags.length) {
    yRef.value += 4
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(t('reports.mostUsedEvents'), 16, yRef.value)
    doc.setFont('helvetica', 'normal')
    yRef.value += 6
    drawBullets(
      doc,
      yRef,
      allTimeTags.slice(0, 5).map(tag => t('reports.tagCountLine', { tag: tag.tag, count: tag.count })),
      18,
    )
  }
}
