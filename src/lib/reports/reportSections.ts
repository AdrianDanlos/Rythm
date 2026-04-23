import type { jsPDF } from 'jspdf'
import { t } from 'i18next'
import type { Entry } from '../entries'
import type { StatsResult } from '../stats'
import { formatLongDate } from '../utils/dateFormatters'
import { formatSleepHours } from '../utils/sleepHours'
import type { ReportData } from './reportData'
import {
  CONTENT_WIDTH,
  PAGE,
  drawCard,
  drawDualSeriesChart,
  drawHorizontalBars,
  drawImpactBars,
  drawSectionHeader,
  drawStatCard,
  ensurePageSpace,
  startNewPage,
} from './reportLayout'

type YRef = {
  value: number
}

const getCardLabel = (value: string) => value.split(':')[0] ?? value

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
  const marginLeft = PAGE.marginLeft
  const logoHeight = 12
  const logoWidth = (100 / 34) * logoHeight
  const heroHeight = 70

  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, pageWidth, heroHeight, 'F')
  doc.setFillColor(30, 41, 59)
  doc.rect(0, heroHeight - 8, pageWidth, 8, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(148, 163, 184)
  doc.text(t('reports.reportLogoLabel'), marginLeft, 12)
  if (brandImage) {
    doc.addImage(brandImage, 'PNG', marginLeft, 16, logoWidth, logoHeight)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(248, 250, 252)
  doc.text(title, marginLeft, 42)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(226, 232, 240)
  doc.text(`${formatLongDate(start)} - ${formatLongDate(end)}`, marginLeft, 50)

  if (welcomeName) {
    doc.setFontSize(10)
    doc.text(t('reports.welcomeReport', { name: welcomeName }), marginLeft, 57)
  }

  yRef.value = heroHeight + 8
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
    monthlyTags,
    avgSleep,
    avgMood,
    bestDay,
    bestNight,
    biggestMoodDip,
    weeklySummaries,
  } = data

  doc.setTextColor(15, 23, 42)
  drawSectionHeader(doc, yRef, t('reports.last30Days'), { showTopRule: false })

  ensurePageSpace(doc, yRef, 58)
  const cardGap = 4
  const cardWidth = (CONTENT_WIDTH - cardGap) / 2
  const cardHeight = 24
  const firstRowY = yRef.value
  const secondRowY = yRef.value + cardHeight + 4
  drawStatCard(doc, PAGE.marginLeft, firstRowY, cardWidth, cardHeight, {
    label: getCardLabel(t('reports.entriesLogged', { count: 0 })),
    value: `${recentEntries.length}`,
    accent: [56, 189, 248],
  })
  drawStatCard(doc, PAGE.marginLeft + cardWidth + cardGap, firstRowY, cardWidth, cardHeight, {
    label: getCardLabel(t('reports.averageSleep', { value: '—' })),
    value: avgSleep !== null ? formatSleepHours(avgSleep) : '—',
    accent: [99, 102, 241],
  })
  drawStatCard(doc, PAGE.marginLeft, secondRowY, cardWidth, cardHeight, {
    label: getCardLabel(t('reports.averageMood', { value: '—' })),
    value: avgMood !== null ? `${avgMood.toFixed(1)} / 5` : '—',
    accent: [16, 185, 129],
  })
  drawStatCard(doc, PAGE.marginLeft + cardWidth + cardGap, secondRowY, cardWidth, cardHeight, {
    label: getCardLabel(t('reports.sleepConsistency', { value: '—' })),
    value: monthlyConsistency ? t(`insights.sleepConsistencyLevels.${monthlyConsistency}`) : '—',
    accent: [234, 179, 8],
  })
  yRef.value += cardHeight * 2 + 10

  if (recentEntries.length > 1) {
    yRef.value += 6
    ensurePageSpace(doc, yRef, 82)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(t('reports.overview'), PAGE.marginLeft, yRef.value)
    doc.setFont('helvetica', 'normal')
    yRef.value += 9
    doc.setFontSize(9)
    doc.setTextColor(99, 102, 241)
    doc.text(t('common.sleep'), PAGE.marginLeft, yRef.value)
    doc.setTextColor(16, 185, 129)
    doc.text(t('common.mood'), PAGE.marginLeft + 24, yRef.value)
    doc.setTextColor(100, 116, 139)
    doc.text(t('reports.last30Days'), PAGE.marginLeft + CONTENT_WIDTH, yRef.value, { align: 'right' })
    yRef.value += 3
    const sorted = [...recentEntries].sort((a, b) => a.entry_date.localeCompare(b.entry_date))
    const points = sorted.map(entry => ({
      label: entry.entry_date,
      primary: entry.sleep_hours === null ? null : Number(entry.sleep_hours),
      secondary: entry.mood === null ? null : Number(entry.mood),
    }))
    drawDualSeriesChart(doc, points, {
      x: PAGE.marginLeft,
      y: yRef.value,
      width: CONTENT_WIDTH,
      height: 54,
      primaryColor: [99, 102, 241],
      secondaryColor: [16, 185, 129],
      primaryRange: { min: 4, max: 10 },
      secondaryRange: { min: 1, max: 5 },
    })
    yRef.value += 62
  }
  yRef.value += 4

  if (bestDay) {
    ensurePageSpace(doc, yRef, 26)
    const bestTags = bestDay.tags?.length ? bestDay.tags.join(', ') : '—'
    drawCard(doc, PAGE.marginLeft, yRef.value, CONTENT_WIDTH, 22, {
      bg: [240, 253, 250],
      border: [167, 243, 208],
    })
    doc.setFontSize(10)
    doc.setTextColor(6, 95, 70)
    doc.setFont('helvetica', 'bold')
    doc.text(`${t('reports.bestDay', { date: formatLongDate(new Date(`${bestDay.entry_date}T00:00:00`)) })} (${t('common.mood')})`, PAGE.marginLeft + 3, yRef.value + 5)
    doc.setFont('helvetica', 'normal')
    doc.text(`${t('reports.moodValue', { value: bestDay.mood ?? '—' })} · ${t('reports.sleepValue', { value: bestDay.sleep_hours !== null ? formatSleepHours(Number(bestDay.sleep_hours)) : '—' })}`, PAGE.marginLeft + 3, yRef.value + 11)
    doc.setFontSize(9)
    doc.text(t('reports.dailyEventsValue', { value: bestTags }), PAGE.marginLeft + 3, yRef.value + 17)
    yRef.value += 26
  }

  if (weeklySummaries.length > 0) {
    yRef.value += 2
    ensurePageSpace(doc, yRef, 60)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(t('reports.weeklyAverages'), PAGE.marginLeft, yRef.value)
    doc.setFont('helvetica', 'normal')
    yRef.value += 6
    drawCard(doc, PAGE.marginLeft, yRef.value, CONTENT_WIDTH, 8, {
      bg: [248, 250, 252],
      border: [226, 232, 240],
    })
    doc.setFontSize(8)
    doc.setTextColor(71, 85, 105)
    doc.text(t('reports.weekLabel'), PAGE.marginLeft + 3, yRef.value + 5)
    doc.text(t('common.sleep'), PAGE.marginLeft + 96, yRef.value + 5)
    doc.text(t('common.mood'), PAGE.marginLeft + 136, yRef.value + 5)
    yRef.value += 10
    weeklySummaries.forEach((week) => {
      ensurePageSpace(doc, yRef, 9)
      drawCard(doc, PAGE.marginLeft, yRef.value, CONTENT_WIDTH, 8, {
        bg: [255, 255, 255],
        border: [226, 232, 240],
      })
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(8)
      doc.text(week.label, PAGE.marginLeft + 3, yRef.value + 5)
      doc.text(week.avgSleep !== null ? formatSleepHours(week.avgSleep) : '—', PAGE.marginLeft + 96, yRef.value + 5)
      doc.text(week.avgMood !== null ? `${week.avgMood.toFixed(1)} / 5` : '—', PAGE.marginLeft + 136, yRef.value + 5)
      yRef.value += 10
    })
    yRef.value += 6
  }

  if (bestNight) {
    ensurePageSpace(doc, yRef, 10)
    doc.setFontSize(10)
    doc.setTextColor(30, 41, 59)
    doc.text(t('reports.bestNight', {
      date: formatLongDate(new Date(`${bestNight.entry_date}T00:00:00`)),
      value: formatSleepHours(Number(bestNight.sleep_hours)),
    }), PAGE.marginLeft, yRef.value)
    yRef.value += 6
  }
  const mostConsistentWeek = weeklySummaries
    .filter(week => week.sleepStdDev !== null)
    .sort((a, b) => (a.sleepStdDev ?? 0) - (b.sleepStdDev ?? 0))[0]
  if (mostConsistentWeek?.sleepStdDev !== null) {
    ensurePageSpace(doc, yRef, 10)
    doc.text(t('reports.mostConsistentWeek', {
      label: mostConsistentWeek.label,
      value: formatSleepHours(mostConsistentWeek.sleepStdDev),
    }), PAGE.marginLeft, yRef.value)
    yRef.value += 6
  }
  if (biggestMoodDip) {
    ensurePageSpace(doc, yRef, 10)
    doc.text(t('reports.biggestMoodDip', {
      from: formatLongDate(new Date(`${biggestMoodDip.from.entry_date}T00:00:00`)),
      to: formatLongDate(new Date(`${biggestMoodDip.to.entry_date}T00:00:00`)),
      delta: biggestMoodDip.delta.toFixed(1),
    }), PAGE.marginLeft, yRef.value)
    yRef.value += 8
  }

  if (monthlyTags.length) {
    yRef.value += 7
    ensurePageSpace(doc, yRef, 52)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(t('reports.mostUsedEvents'), PAGE.marginLeft, yRef.value)
    doc.setFont('helvetica', 'normal')
    yRef.value += 6
    const maxCount = Math.max(...monthlyTags.map(tag => tag.count), 1)
    const usedHeight = drawHorizontalBars(
      doc,
      monthlyTags.slice(0, 5).map(tag => ({
        label: tag.tag,
        value: tag.count,
        displayValue: `${tag.count}`,
      })),
      {
        x: PAGE.marginLeft,
        y: yRef.value,
        width: CONTENT_WIDTH - 12,
        itemHeight: 8,
        gap: 2,
        maxValue: maxCount,
        color: [56, 189, 248],
      },
    )
    yRef.value += usedHeight + 4
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
  drawSectionHeader(doc, yRef, t('reports.allTime'), { showTopRule: false })
  ensurePageSpace(doc, yRef, 58)
  const cardGap = 4
  const cardWidth = (CONTENT_WIDTH - cardGap) / 2
  const cardHeight = 24
  drawStatCard(doc, PAGE.marginLeft, yRef.value, cardWidth, cardHeight, {
    label: getCardLabel(t('reports.entriesLogged', { count: 0 })),
    value: `${entries.length}`,
    helper: t('reports.allTime'),
    accent: [56, 189, 248],
  })
  drawStatCard(doc, PAGE.marginLeft + cardWidth + cardGap, yRef.value, cardWidth, cardHeight, {
    label: getCardLabel(t('reports.streakValue', { count: 0, unit: t('common.days') })),
    value: `${stats.streak} ${stats.streak === 1 ? t('common.day') : t('common.days')}`,
    helper: t('reports.summary'),
    accent: [20, 184, 166],
  })
  drawStatCard(doc, PAGE.marginLeft, yRef.value + cardHeight + 4, cardWidth, cardHeight, {
    label: getCardLabel(t('reports.averageSleep', { value: '—' })),
    value: allTimeAvgSleep !== null ? formatSleepHours(allTimeAvgSleep) : '—',
    helper: stats.sleepConsistencyLabel ? t(`insights.sleepConsistencyLevels.${stats.sleepConsistencyLabel}`) : '—',
    accent: [99, 102, 241],
  })
  drawStatCard(doc, PAGE.marginLeft + cardWidth + cardGap, yRef.value + cardHeight + 4, cardWidth, cardHeight, {
    label: getCardLabel(t('reports.averageMood', { value: '—' })),
    value: allTimeAvgMood !== null ? `${allTimeAvgMood.toFixed(1)} / 5` : '—',
    helper: stats.correlationLabel ? t(`insights.correlationLevels.${stats.correlationLabel}`) : '—',
    accent: [251, 146, 60],
  })
  yRef.value += cardHeight * 2 + 10

  const moodPos = allTimeTagDrivers.filter(d => (d.delta ?? 0) > 0).sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0)).slice(0, 4)
  const moodNeg = allTimeTagDrivers.filter(d => (d.delta ?? 0) < 0).sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0)).slice(0, 4)
  const sleepPos = allTimeTagSleepDrivers.filter(d => (d.delta ?? 0) > 0).sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0)).slice(0, 4)
  const sleepNeg = allTimeTagSleepDrivers.filter(d => (d.delta ?? 0) < 0).sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0)).slice(0, 4)

  if (moodPos.length > 0 || moodNeg.length > 0) {
    yRef.value += 7
    ensurePageSpace(doc, yRef, 66)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(t('reports.eventsPredictMood'), PAGE.marginLeft, yRef.value)
    doc.setFont('helvetica', 'normal')
    yRef.value += 6
    const moodItems = [...moodPos, ...moodNeg]
      .sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0))
      .slice(0, 6)
      .map(item => ({ label: item.tag, delta: item.delta ?? 0 }))
    const maxMoodAbs = Math.max(...moodItems.map(item => Math.abs(item.delta)), 0.1)
    const usedHeight = drawImpactBars(doc, moodItems, {
      x: PAGE.marginLeft,
      y: yRef.value,
      width: CONTENT_WIDTH - 12,
      maxAbs: maxMoodAbs,
    })
    yRef.value += usedHeight + 6
  }

  if (sleepPos.length > 0 || sleepNeg.length > 0) {
    yRef.value += 7
    ensurePageSpace(doc, yRef, 66)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(t('reports.eventsPredictSleep'), PAGE.marginLeft, yRef.value)
    doc.setFont('helvetica', 'normal')
    yRef.value += 6
    const sleepItems = [...sleepPos, ...sleepNeg]
      .sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0))
      .slice(0, 6)
      .map(item => ({ label: item.tag, delta: item.delta ?? 0 }))
    const maxSleepAbs = Math.max(...sleepItems.map(item => Math.abs(item.delta)), 0.1)
    const usedHeight = drawImpactBars(doc, sleepItems, {
      x: PAGE.marginLeft,
      y: yRef.value,
      width: CONTENT_WIDTH - 12,
      maxAbs: maxSleepAbs,
    })
    yRef.value += usedHeight + 6
  }

  if (allTimeTags.length) {
    yRef.value += 7
    ensurePageSpace(doc, yRef, 54)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(t('reports.mostUsedEvents'), PAGE.marginLeft, yRef.value)
    doc.setFont('helvetica', 'normal')
    yRef.value += 6
    const maxCount = Math.max(...allTimeTags.map(tag => tag.count), 1)
    const barsHeight = drawHorizontalBars(
      doc,
      allTimeTags.slice(0, 6).map(tag => ({
        label: tag.tag,
        value: tag.count,
        displayValue: `${tag.count}`,
      })),
      {
        x: PAGE.marginLeft,
        y: yRef.value,
        width: CONTENT_WIDTH - 12,
        itemHeight: 8,
        gap: 2,
        maxValue: maxCount,
        color: [56, 189, 248],
      },
    )
    yRef.value += barsHeight + 4
  }
}
