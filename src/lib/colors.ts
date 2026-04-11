export const moodColors = ['#f87171', '#fb923c', '#facc15', '#a3e635', '#4ade80']

export const sleepHeatmapColors = ['#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1']

export const rollingTrendColors = {
  mid: '#2563eb',
  long: '#f97316',
}

// Palette for tag/event colors – mirrors CSS variables --tag-pill-0..7
export const tagColorPalette = [
  '#4f46e5', // --tag-pill-0
  '#059669', // --tag-pill-1
  '#d97706', // --tag-pill-2
  '#db2777', // --tag-pill-3
  '#0284c7', // --tag-pill-4
  '#7c3aed', // --tag-pill-5
  '#16a34a', // --tag-pill-6
  '#ea580c', // --tag-pill-7
]

/** Deterministic palette color when the user has not set a custom tag color (same hash as timeline filters). */
export const getFallbackTagColor = (tagKey: string) => {
  let hash = 0
  for (let i = 0; i < tagKey.length; i += 1) {
    hash = (hash << 5) - hash + tagKey.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % tagColorPalette.length
  return tagColorPalette[index]
}
