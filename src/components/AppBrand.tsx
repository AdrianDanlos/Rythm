import { PLAY_STORE_APP_URL } from '../lib/constants'
import { useTranslation } from 'react-i18next'
import logo from '../assets/rythm-logo-small.png'

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
      <img className="app-logo" src={logo} alt={t('common.appTagline')} />
    </a>
  )
}
