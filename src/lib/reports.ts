import { jsPDF } from 'jspdf'
import logo from '../assets/rythm-logo.png'
import type { Entry } from './entries'
import type { StatsResult } from './stats'
import { exportFile } from './utils/fileExport'
import {
  buildReportData,
  getEntriesInRange,
  getReportRange,
} from './reports/reportData'
import {
  renderAllTimeSection,
  renderLast30DaysSection,
  renderReportHeader,
} from './reports/reportSections'

type ReportOptions = {
  rangeDays?: number
  title?: string
  profileName?: string
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to load report logo'))
    image.src = src
  })

export const exportMonthlyReport = async (
  entries: Entry[],
  stats: StatsResult,
  options: ReportOptions = {},
) => {
  const rangeDays = options.rangeDays ?? 30
  const title = options.title ?? 'Rythm Report'
  const welcomeName = options.profileName?.trim()
  const doc = new jsPDF()
  const range = getReportRange(rangeDays)
  const recentEntries = getEntriesInRange(entries, range.start, range.end)
  const priorEntries = getEntriesInRange(entries, range.priorStart, range.priorEnd)
  const reportData = buildReportData(entries, recentEntries, priorEntries)
  const yRef = { value: 18 }
  let brandImage: HTMLImageElement | undefined
  try {
    brandImage = await loadImage(logo)
  }
  catch {
    brandImage = undefined
  }

  renderReportHeader({
    doc,
    yRef,
    title,
    welcomeName,
    start: range.start,
    end: range.end,
    brandImage,
  })
  renderLast30DaysSection({ doc, yRef, data: reportData })
  renderAllTimeSection({
    doc,
    yRef,
    entries,
    stats,
    allTimeAvgSleep: reportData.allTimeAvgSleep,
    allTimeAvgMood: reportData.allTimeAvgMood,
    allTimeTags: reportData.allTimeTags,
    allTimeTagDrivers: reportData.allTimeTagDrivers,
    allTimeTagSleepDrivers: reportData.allTimeTagSleepDrivers,
  })

  const pdfBuffer = doc.output('arraybuffer') as ArrayBuffer
  await exportFile({
    filename: 'rythm-report.pdf',
    mimeType: 'application/pdf',
    data: pdfBuffer,
  })
}
