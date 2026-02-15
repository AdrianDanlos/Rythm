import { PLAY_STORE_APP_URL } from '../lib/constants'
import logo from '../assets/rythm-logo.png'
import logoBlack from '../assets/rythm-logo-black.png'

export function AppBrand({ className }: { className?: string }) {
  return (
    <a
      className={`app-brand ${className ?? ''}`.trim()}
      href={PLAY_STORE_APP_URL}
      target="_blank"
      rel="noreferrer"
    >
      <p className="eyebrow">Sleep & Mood Tracker</p>
      <img className="app-logo app-logo-light" src={logoBlack} alt="Rythm logo" />
      <img className="app-logo app-logo-dark" src={logo} alt="Rythm logo" />
    </a>
  )
}
