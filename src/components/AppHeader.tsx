import { Menu } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppBrand } from './AppBrand'
import { Tooltip } from './Tooltip'

type AppHeaderProps = {
  onOpenMenu?: () => void
}

export function AppHeader({ onOpenMenu }: AppHeaderProps) {
  const { t } = useTranslation()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`app-header${isScrolled ? ' app-header--scrolled' : ''}`}>
      <div className="app-header-top">
        <p className="app-header-eyebrow">{t('common.appTagline')}</p>
      </div>
      <div className="header-left">
        <Tooltip label={t('nav.menu')}>
          <button
            className="app-header-menu-btn"
            type="button"
            onClick={() => onOpenMenu?.()}
            aria-label={t('nav.menu')}
          >
            <Menu className="icon" aria-hidden="true" />
          </button>
        </Tooltip>
        <AppBrand logoOnly />
      </div>
    </header>
  )
}
