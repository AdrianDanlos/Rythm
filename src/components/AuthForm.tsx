import type { FormEvent } from 'react'
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
