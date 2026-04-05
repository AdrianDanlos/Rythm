import eventsSvg from '../assets/events.svg?raw'
import happySvg from '../assets/happy.svg?raw'
import relaxSvg from '../assets/relax.svg?raw'

/** Swap undraw default purple / pink / slate for theme tokens (used inside intro carousel). */
function themeIntroSvgMarkup(svg: string): string {
  return svg
    .replace(/#6c63ff/gi, 'var(--intro-svg-accent)')
    .replace(/#ff6584/gi, 'var(--intro-svg-secondary)')
    .replace(/#3f3d56/gi, 'var(--intro-svg-slate)')
    .replace(/#090814/gi, 'var(--intro-svg-ink)')
    .replace(/#2f2e41/gi, 'var(--intro-svg-ink)')
    .replace(/#ffffff/gi, 'var(--intro-svg-paper)')
    .replace(/#f2f2f2/gi, 'var(--intro-svg-wash)')
    .replace(/#e6e6e6/gi, 'var(--intro-svg-wash-2)')
    .replace(/#d6d6e3/gi, 'var(--intro-svg-wash-3)')
    .replace(/#ed9da0/gi, 'var(--intro-svg-skin)')
    .replace(/#fff\b/gi, 'var(--intro-svg-paper)')
}

/**
 * `events.svg`: chart overlay uses white paths that read like light “veins”.
 * Only those paths use `transform="translate(-84…)"` + `fill="#fff"` (see asset).
 */
function themeEventsSvgMarkup(raw: string): string {
  const withVeins = raw.replace(
    /transform="translate\(-84[^"]*\)" fill="#fff"/g,
    m => m.replace('fill="#fff"', 'fill="var(--intro-svg-vein)"'),
  )
  return themeIntroSvgMarkup(withVeins)
}

/** Order: relax → events → happy (matches `IntroCarousel` slide order). */
export const introThemedSvgMarkup: readonly [string, string, string] = [
  themeIntroSvgMarkup(relaxSvg),
  themeEventsSvgMarkup(eventsSvg),
  themeIntroSvgMarkup(happySvg),
]
