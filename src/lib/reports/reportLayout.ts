import type { jsPDF } from 'jspdf'

type YRef = {
  value: number
}

export const PAGE = {
  marginLeft: 14,
  marginRight: 14,
  top: 18,
  bottom: 18,
}

export const CONTENT_WIDTH = 210 - PAGE.marginLeft - PAGE.marginRight

export const ensurePageSpace = (
  doc: jsPDF,
  yRef: YRef,
  neededHeight = 0,
) => {
  const pageHeight = doc.internal.pageSize.getHeight()
  if (yRef.value + neededHeight > pageHeight - PAGE.bottom) {
    doc.addPage()
    yRef.value = PAGE.top
    return true
  }
  return false
}

export const startNewPage = (doc: jsPDF, yRef: YRef) => {
  doc.addPage()
  yRef.value = PAGE.top
}

export const drawSectionHeader = (doc: jsPDF, yRef: YRef, label: string) => {
  ensurePageSpace(doc, yRef, 18)
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.4)
  doc.line(PAGE.marginLeft, yRef.value - 4, PAGE.marginLeft + CONTENT_WIDTH, yRef.value - 4)
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(label, PAGE.marginLeft, yRef.value + 1)
  doc.setFont('helvetica', 'normal')
  yRef.value += 12
}

type CardOptions = {
  bg?: [number, number, number]
  border?: [number, number, number]
}

export const drawCard = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  options: CardOptions = {},
) => {
  const bg = options.bg ?? [248, 250, 252]
  const border = options.border ?? [226, 232, 240]
  doc.setFillColor(...bg)
  doc.setDrawColor(...border)
  doc.setLineWidth(0.3)
  doc.roundedRect(x, y, width, height, 2, 2, 'FD')
}

type StatCardOptions = {
  label: string
  value: string
  helper?: string
  accent?: [number, number, number]
}

export const drawStatCard = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  options: StatCardOptions,
) => {
  drawCard(doc, x, y, width, height)
  if (options.accent) {
    doc.setFillColor(...options.accent)
    doc.rect(x, y, width, 2, 'F')
  }
  doc.setTextColor(71, 85, 105)
  doc.setFontSize(9)
  doc.text(options.label, x + 3, y + 6)
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(options.value, x + 3, y + 13)
  doc.setFont('helvetica', 'normal')
  if (options.helper) {
    doc.setTextColor(100, 116, 139)
    doc.setFontSize(8)
    doc.text(options.helper, x + 3, y + 18)
  }
}

type HorizontalBarItem = {
  label: string
  value: number
  displayValue?: string
}

type HorizontalBarChartOptions = {
  x: number
  y: number
  width: number
  itemHeight?: number
  gap?: number
  maxValue?: number
  color?: [number, number, number]
}

export const drawHorizontalBars = (
  doc: jsPDF,
  items: HorizontalBarItem[],
  options: HorizontalBarChartOptions,
) => {
  if (!items.length) return 0
  const itemHeight = options.itemHeight ?? 8
  const gap = options.gap ?? 3
  const maxValue = options.maxValue ?? Math.max(...items.map(item => item.value), 1)
  const barX = options.x + 46
  const barWidth = Math.max(24, options.width - 52)
  const color = options.color ?? [14, 165, 233]

  items.forEach((item, index) => {
    const y = options.y + index * (itemHeight + gap)
    doc.setTextColor(15, 23, 42)
    doc.setFontSize(9)
    doc.text(item.label, options.x, y + 5)

    doc.setFillColor(241, 245, 249)
    doc.roundedRect(barX, y + 1, barWidth, itemHeight - 2, 1.3, 1.3, 'F')
    doc.setFillColor(...color)
    const currentWidth = Math.max(0, (item.value / maxValue) * barWidth)
    doc.roundedRect(barX, y + 1, currentWidth, itemHeight - 2, 1.3, 1.3, 'F')

    doc.setTextColor(71, 85, 105)
    doc.text(item.displayValue ?? `${item.value}`, barX + barWidth + 2, y + 5)
  })

  return items.length * itemHeight + (items.length - 1) * gap
}

type ImpactBarItem = {
  label: string
  delta: number
}

type ImpactBarsOptions = {
  x: number
  y: number
  width: number
  maxAbs: number
}

export const drawImpactBars = (
  doc: jsPDF,
  items: ImpactBarItem[],
  options: ImpactBarsOptions,
) => {
  if (!items.length) return 0
  const itemHeight = 7
  const gap = 3
  const axisX = options.x + options.width / 2
  const halfWidth = options.width / 2

  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.25)
  doc.line(axisX, options.y - 1, axisX, options.y + items.length * (itemHeight + gap))

  items.forEach((item, index) => {
    const y = options.y + index * (itemHeight + gap)
    doc.setTextColor(15, 23, 42)
    doc.setFontSize(9)
    doc.text(item.label, options.x, y + 4.5)

    const scaled = options.maxAbs > 0
      ? Math.min(halfWidth - 20, (Math.abs(item.delta) / options.maxAbs) * (halfWidth - 20))
      : 0
    const color = item.delta >= 0 ? [16, 185, 129] as [number, number, number] : [239, 68, 68] as [number, number, number]
    doc.setFillColor(...color)
    if (item.delta >= 0) {
      doc.roundedRect(axisX + 0.8, y + 1, scaled, itemHeight - 2, 1, 1, 'F')
    }
    else {
      doc.roundedRect(axisX - scaled - 0.8, y + 1, scaled, itemHeight - 2, 1, 1, 'F')
    }

    doc.setTextColor(71, 85, 105)
    const deltaText = item.delta > 0 ? `+${item.delta.toFixed(1)}` : item.delta.toFixed(1)
    doc.text(deltaText, options.x + options.width + 2, y + 4.5)
  })

  return items.length * itemHeight + (items.length - 1) * gap
}

export const drawBullets = (
  doc: jsPDF,
  yRef: YRef,
  lines: string[],
  indent = 16,
) => {
  doc.setFontSize(11)
  lines.forEach((line) => {
    ensurePageSpace(doc, yRef, 8)
    doc.text(`• ${line}`, indent, yRef.value)
    yRef.value += 6
  })
  doc.setFontSize(12)
}

export const drawLines = (
  doc: jsPDF,
  yRef: YRef,
  lines: string[],
  indent = 18,
) => {
  doc.setFontSize(11)
  lines.forEach((line) => {
    ensurePageSpace(doc, yRef, 8)
    doc.text(line, indent, yRef.value)
    yRef.value += 6
  })
  doc.setFontSize(12)
}

/** Catmull-Rom to cubic Bezier: segment from p1 to p2 with neighbors p0, p3 */
const smoothSegment = (
  p0: { x: number, y: number },
  p1: { x: number, y: number },
  p2: { x: number, y: number },
  p3: { x: number, y: number },
  tension = 6,
) => {
  const cp1x = p1.x + (p2.x - p0.x) / tension
  const cp1y = p1.y + (p2.y - p0.y) / tension
  const cp2x = p2.x - (p3.x - p1.x) / tension
  const cp2y = p2.y - (p3.y - p1.y) / tension
  return { cp1x, cp1y, cp2x, cp2y, endx: p2.x, endy: p2.y }
}

export const drawSparkline = (
  doc: jsPDF,
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
      const px = x + (index / Math.max(1, values.length - 1)) * width
      const py = yStart + height - ((value - min) / span) * height
      return { x: px, y: py }
    })
    .filter((point): point is { x: number, y: number } => point !== null)
  if (points.length < 2) return
  doc.setDrawColor(...color)
  doc.setLineWidth(0.6)
  doc.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i += 1) {
    const p0 = points[i - 2] ?? points[i - 1]
    const p1 = points[i - 1]
    const p2 = points[i]
    const p3 = points[i + 1] ?? points[i]
    const { cp1x, cp1y, cp2x, cp2y, endx, endy } = smoothSegment(p0, p1, p2, p3)
    doc.curveTo(cp1x, cp1y, cp2x, cp2y, endx, endy)
  }
  doc.stroke()
}

type DualSeriesPoint = {
  label: string
  primary: number | null
  secondary: number | null
}

type DualSeriesChartOptions = {
  x: number
  y: number
  width: number
  height: number
  primaryColor: [number, number, number]
  secondaryColor: [number, number, number]
  primaryRange: { min: number, max: number }
  secondaryRange: { min: number, max: number }
}

export const drawDualSeriesChart = (
  doc: jsPDF,
  points: DualSeriesPoint[],
  options: DualSeriesChartOptions,
) => {
  if (points.length < 2) return

  drawCard(doc, options.x, options.y, options.width, options.height, {
    bg: [255, 255, 255],
    border: [226, 232, 240],
  })

  const chartX = options.x + 6
  const chartY = options.y + 6
  const chartWidth = options.width - 12
  const chartHeight = options.height - 14

  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.2)
  for (let i = 0; i <= 2; i += 1) {
    const y = chartY + (chartHeight / 2) * i
    doc.line(chartX, y, chartX + chartWidth, y)
  }

  const normalize = (value: number, min: number, max: number) => {
    const span = max - min || 1
    return (value - min) / span
  }

  const project = (
    index: number,
    value: number,
    range: { min: number, max: number },
  ) => {
    const px = chartX + (index / Math.max(1, points.length - 1)) * chartWidth
    const py = chartY + chartHeight - normalize(value, range.min, range.max) * chartHeight
    return { x: px, y: py }
  }

  const drawSeries = (
    series: Array<number | null>,
    color: [number, number, number],
    range: { min: number, max: number },
  ) => {
    const projected = series
      .map((value, index) => (value === null ? null : project(index, value, range)))
      .filter((point): point is { x: number, y: number } => point !== null)
    if (projected.length < 2) return
    doc.setDrawColor(...color)
    doc.setLineWidth(0.8)
    doc.moveTo(projected[0].x, projected[0].y)
    for (let i = 1; i < projected.length; i += 1) {
      const p0 = projected[i - 2] ?? projected[i - 1]
      const p1 = projected[i - 1]
      const p2 = projected[i]
      const p3 = projected[i + 1] ?? projected[i]
      const { cp1x, cp1y, cp2x, cp2y, endx, endy } = smoothSegment(p0, p1, p2, p3)
      doc.curveTo(cp1x, cp1y, cp2x, cp2y, endx, endy)
    }
    doc.stroke()
  }

  drawSeries(points.map(point => point.primary), options.primaryColor, options.primaryRange)
  drawSeries(points.map(point => point.secondary), options.secondaryColor, options.secondaryRange)

  const firstLabel = points[0]?.label ?? ''
  const lastLabel = points[points.length - 1]?.label ?? ''
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text(firstLabel, chartX, options.y + options.height - 2)
  doc.text(lastLabel, chartX + chartWidth, options.y + options.height - 2, { align: 'right' })
}
