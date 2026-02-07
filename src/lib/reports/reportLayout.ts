import type { jsPDF } from 'jspdf'

type YRef = {
  value: number
}

const ensurePageSpace = (doc: jsPDF, yRef: YRef) => {
  if (yRef.value > 270) {
    doc.addPage()
    yRef.value = 18
  }
}

export const startNewPage = (doc: jsPDF, yRef: YRef) => {
  doc.addPage()
  yRef.value = 18
}

export const drawSectionHeader = (doc: jsPDF, yRef: YRef, label: string) => {
  doc.setFillColor(15, 23, 42)
  doc.rect(14, yRef.value - 5, 182, 9, 'F')
  doc.setTextColor(255)
  doc.setFontSize(13)
  doc.text(label, 16, yRef.value + 1)
  doc.setTextColor(20)
  yRef.value += 12
}

export const drawBullets = (
  doc: jsPDF,
  yRef: YRef,
  lines: string[],
  indent = 16,
) => {
  doc.setFontSize(11)
  lines.forEach((line) => {
    doc.text(`• ${line}`, indent, yRef.value)
    yRef.value += 6
    ensurePageSpace(doc, yRef)
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
    doc.text(line, indent, yRef.value)
    yRef.value += 6
    ensurePageSpace(doc, yRef)
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
