import { Menu } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AppBrand } from './AppBrand'

type AppHeaderProps = {
  onOpenMenu?: () => void
  isMenuOpen?: boolean
  isAuthenticated?: boolean
}

export function AppHeader({
  onOpenMenu,
  isMenuOpen,
  isAuthenticated,
}: AppHeaderProps) {
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
        <p className="app-header-eyebrow">Rythm</p>
      </div>
      <div className="header-left">
        {isAuthenticated && (
          <button
            className="app-header-menu-btn"
            type="button"
            onClick={() => onOpenMenu?.()}
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
