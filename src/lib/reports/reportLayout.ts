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

export const drawSectionHeader = (doc: jsPDF, yRef: YRef, label: string) => {
  doc.setFillColor(238, 242, 255)
  doc.rect(14, yRef.value - 5, 182, 9, 'F')
  doc.setTextColor(15)
  doc.setFontSize(13)
  doc.text(label, 16, yRef.value + 1)
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
      const px = x + (index / (values.length - 1)) * width
      const py = yStart + height - ((value - min) / span) * height
      return { x: px, y: py }
    })
    .filter((point): point is { x: number, y: number } => point !== null)
  if (points.length < 2) return
  doc.setDrawColor(...color)
  doc.setLineWidth(0.6)
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1]
    const next = points[i]
    doc.line(prev.x, prev.y, next.x, next.y)
  }
}
