import type { FormEvent } from 'react'
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
  if (!showEmailPassword) {
    return (
      <button
        className="ghost oauth-button oauth-button--standalone"
        type="button"
        onClick={onGoogleSignIn}
      >
        <img className="oauth-logo" src={googleLogo} alt="Google logo" />
        Continue with Google
      </button>
    )
  }

  return (
    <section className="card auth-card">
      <h2 className="auth-title">
        {authMode === 'signin' ? 'Sign in' : 'Create account'}
      </h2>
      <form onSubmit={onSubmit} className="stack">
        <label className="field">
          Email
          <input
            type="email"
            value={authEmail}
            onChange={event => onEmailChange(event.target.value)}
            placeholder="you@email.com"
            required
          />
        </label>
        <label className="field">
          Password
          <input
            type="password"
            value={authPassword}
            onChange={event => onPasswordChange(event.target.value)}
            placeholder="••••••••"
            required
            minLength={authMode === 'signup' ? 6 : undefined}
            title={authMode === 'signup' ? 'At least 6 characters' : undefined}
          />
          {authMode === 'signup'
            ? (
                <span className="field-hint" aria-live="polite">
                  At least 6 characters
                </span>
              )
            : null}
        </label>
        <button type="submit" disabled={authLoading}>
          {authLoading
            ? 'Working...'
            : authMode === 'signin'
              ? 'Sign in'
              : 'Sign up'}
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
        <img className="oauth-logo" src={googleLogo} alt="Google logo" />
        Continue with Google
      </button>
      <button className="ghost auth-toggle" type="button" onClick={onToggleMode}>
        {authMode === 'signin'
          ? 'Need an account? Sign up'
          : 'Already have an account? Sign in'}
      </button>
    </section>
  )
}
