import { useState } from 'react'

type InsightsQuickStartProps = {
  onStartLog: () => void
}

export const InsightsQuickStart = ({ onStartLog }: InsightsQuickStartProps) => {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.localStorage.getItem('rythm-hide-insights-intro') !== 'true'
  })

  if (!isVisible) return null

  const handleDismiss = () => {
    setIsVisible(false)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('rythm-hide-insights-intro', 'true')
    }
  }

  return (
    <section className="card insights-intro">
      <div className="insights-intro__header">
        <div>
          <p className="eyebrow">Quick start</p>
          <h2>Understand your sleep + mood patterns</h2>
          <p className="muted">
            Log a few nights and we highlight trends, consistency, and tags
            that move your mood.
          </p>
        </div>
      </div>
      <div className="insights-intro__steps">
        <div className="intro-step">
          <span className="intro-step__number">1</span>
          <p>Log sleep hours and mood.</p>
        </div>
        <div className="intro-step">
          <span className="intro-step__number">2</span>
          <p>Add a note or tags (coffee, workout, stress).</p>
        </div>
        <div className="intro-step">
          <span className="intro-step__number">3</span>
          <p>Come back to see patterns and streaks.</p>
        </div>
      </div>
      <div className="insights-intro__actions">
        <button
          className="primary-button cta-button"
          type="button"
          onClick={onStartLog}
        >
          Log today
        </button>
        <button
          className="ghost"
          type="button"
          onClick={handleDismiss}
        >
          Got it
        </button>
        <p className="helper">Tip: the charts improve after 3–5 entries.</p>
      </div>
    </section>
  )
}
