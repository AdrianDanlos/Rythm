import { PLAY_STORE_APP_URL } from '../lib/constants'
import { useTranslation } from 'react-i18next'
import logo from '../assets/rythm-logo.png'
import logoBlack from '../assets/rythm-logo-black.png'

export function AppBrand({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <a
      className={`app-brand ${className ?? ''}`.trim()}
      href={PLAY_STORE_APP_URL}
      target="_blank"
      rel="noreferrer"
    >
      <p className="eyebrow">{t('common.appTagline')}</p>
      <img className="app-logo app-logo-light" src={logoBlack} alt={t('common.appTagline')} />
      <img className="app-logo app-logo-dark" src={logo} alt={t('common.appTagline')} />
    </a>
  )
}
