import type { FormEvent } from 'react'
import { Capacitor } from '@capacitor/core'
import { useTranslation } from 'react-i18next'
import googleLogo from '../assets/google-logo.png'

type AuthFormProps = {
  authMode: 'signin' | 'signup'
  authEmail: string
  authPassword: string
  authLoading: boolean
  showEmailPassword?: boolean
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent) => void
  onGoogleSignIn: () => void
  onToggleMode: () => void
}

function NativeGoogleLoginScreen({ onGoogleSignIn }: { onGoogleSignIn: () => void }) {
  const { t } = useTranslation()

  return (
    <div className="native-auth-screen">
      <div className="native-auth-screen__inner">
        <div className="native-auth-screen__icon-wrap" aria-hidden="true">
          <div className="native-auth-screen__icon-gradient">
            <svg
              className="native-auth-screen__padlock"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </div>
        </div>
        <h1 className="native-auth-screen__title">{t('auth.welcome')}</h1>
        <p className="native-auth-screen__subtitle">{t('auth.signInToContinue')}</p>
        <button
          className="native-auth-screen__google-btn"
          type="button"
          onClick={onGoogleSignIn}
        >
          <img className="native-auth-screen__google-logo" src={googleLogo} alt="" />
          <span>{t('auth.continueWithGoogle')}</span>
        </button>
        <div className="native-auth-screen__divider" role="presentation">
          <span className="native-auth-screen__divider-line" />
          <span className="native-auth-screen__divider-text">{t('auth.secureSignIn')}</span>
          <span className="native-auth-screen__divider-line" />
        </div>
        <p className="native-auth-screen__legal">{t('auth.signInBenefit')}</p>
      </div>
    </div>
  )
}

export const AuthForm = ({
  authMode,
  authEmail,
  authPassword,
  authLoading,
  showEmailPassword = true,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onGoogleSignIn,
  onToggleMode,
}: AuthFormProps) => {
  const { t } = useTranslation()
  if (!showEmailPassword) {
    if (Capacitor.getPlatform() === 'android') {
      return <NativeGoogleLoginScreen onGoogleSignIn={onGoogleSignIn} />
    }
    return (
      <button
        className="ghost oauth-button oauth-button--standalone"
        type="button"
        onClick={onGoogleSignIn}
      >
        <img className="oauth-logo" src={googleLogo} alt={t('common.googleLogoAlt')} />
        {t('auth.continueWithGoogle')}
      </button>
    )
  }

  return (
    <section className="card auth-card">
      <h2 className="auth-title">
        {authMode === 'signin' ? t('auth.signIn') : t('auth.createAccount')}
      </h2>
      <form onSubmit={onSubmit} className="stack">
        <label className="field">
          {t('auth.email')}
          <input
            type="email"
            value={authEmail}
            onChange={event => onEmailChange(event.target.value)}
            placeholder={t('auth.email')}
            required
          />
        </label>
        <label className="field">
          {t('auth.password')}
          <input
            type="password"
            value={authPassword}
            onChange={event => onPasswordChange(event.target.value)}
            placeholder="••••••••"
            required
            minLength={authMode === 'signup' ? 6 : undefined}
            title={authMode === 'signup' ? t('auth.passwordMinLength') : undefined}
          />
          {authMode === 'signup'
            ? (
                <span className="field-hint" aria-live="polite">
                  {t('auth.passwordMinLength')}
                </span>
              )
            : null}
        </label>
        <button type="submit" disabled={authLoading}>
          {authLoading
            ? t('auth.working')
            : authMode === 'signin'
              ? t('auth.signIn')
              : t('auth.signUp')}
        </button>
      </form>
      <button
        className="ghost oauth-button"
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onGoogleSignIn()
        }}
      >
        <img className="oauth-logo" src={googleLogo} alt={t('common.googleLogoAlt')} />
        {t('auth.continueWithGoogle')}
      </button>
      <button className="ghost auth-toggle" type="button" onClick={onToggleMode}>
        {authMode === 'signin'
          ? t('auth.needAccount')
          : t('auth.alreadyHaveAccount')}
      </button>
    </section>
  )
}
