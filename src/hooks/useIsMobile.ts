import { useEffect, useState } from 'react'

/**
 * Tracks whether the viewport matches a given max-width query.
 * Defaults to `(max-width: 540px)` to mirror the existing behavior in Insights.
 */
export function useIsMobile(query = '(max-width: 540px)') {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') {
      return undefined
    }

    const media = window.matchMedia(query)
    const handleChange = () => setIsMobile(media.matches)

    handleChange()

    if (media.addEventListener) {
      media.addEventListener('change', handleChange)
      return () => media.removeEventListener('change', handleChange)
    }

    media.addListener(handleChange)
    return () => media.removeListener(handleChange)
  }, [query])

  return isMobile
}

