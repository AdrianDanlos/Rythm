import { Menu } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppBrand } from './AppBrand'

type AppHeaderProps = {
  onOpenMenu?: () => void
  isMenuOpen?: boolean
  isAuthenticated?: boolean
  /** When true, the hamburger control is inactive (e.g. first-time log quick start). */
  isMenuDisabled?: boolean
}

export function AppHeader({
  onOpenMenu,
  isMenuOpen,
  isAuthenticated,
  isMenuDisabled,
}: AppHeaderProps) {
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

  const headerClasses = [
    'app-header',
    isScrolled ? 'app-header--scrolled' : '',
    isMenuOpen ? 'app-header--menu-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <header className={headerClasses}>
      <div className="app-header-top">
        <p className="app-header-eyebrow">{t('common.appTagline')}</p>
      </div>
      <div className="header-left">
        {isAuthenticated && (
          <button
            className="app-header-menu-btn"
            type="button"
            disabled={!!isMenuDisabled}
            onClick={() => {
              if (isMenuDisabled) return
              onOpenMenu?.()
            }}
            aria-label="Menu"
          >
            <Menu className="icon" aria-hidden="true" />
          </button>
        )}
        <AppBrand logoOnly />
      </div>
    </header>
  )
}
