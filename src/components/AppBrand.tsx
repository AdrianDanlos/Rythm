import { PLAY_STORE_APP_URL } from '../lib/constants'
import logo from '../assets/rythm-logo.png'

export function AppBrand({ className }: { className?: string }) {
  return (
    <a
      className={`app-brand ${className ?? ''}`.trim()}
      href={PLAY_STORE_APP_URL}
      target="_blank"
      rel="noreferrer"
    >
      <img className="app-logo" src={logo} alt="Rythm logo" />
      <div>
        <p className="eyebrow">Sleep & Mood Tracker</p>
        <h1>Rythm</h1>
      </div>
    </a>
  )
}
