import type { FormEvent, KeyboardEvent } from 'react'
import googleLogo from '../assets/google-logo.png'

type AuthFormProps = {
  authMode: 'signin' | 'signup'
  authEmail: string
  authPassword: string
  authLoading: boolean
  authError: string | null
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
  authError,
  showEmailPassword = true,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onGoogleSignIn,
  onToggleMode,
}: AuthFormProps) => {
  const handleContainerClick = () => {
    if (!showEmailPassword) {
      onGoogleSignIn()
    }
  }

  const handleContainerKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (showEmailPassword) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onGoogleSignIn()
    }
  }

  return (
    <section
      className="card auth-card"
      onClick={showEmailPassword ? undefined : handleContainerClick}
      onKeyDown={showEmailPassword ? undefined : handleContainerKeyDown}
      role={showEmailPassword ? undefined : 'button'}
      tabIndex={showEmailPassword ? undefined : 0}
    >
      {showEmailPassword
        ? (
            <h2 className="auth-title">
              {authMode === 'signin' ? 'Sign in' : 'Create account'}
            </h2>
          )
        : null}
      {showEmailPassword
        ? (
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
                />
              </label>
              <button type="submit" disabled={authLoading}>
                {authLoading
                  ? 'Working...'
                  : authMode === 'signin'
                    ? 'Sign in'
                    : 'Sign up'}
              </button>
            </form>
          )
        : null}
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
      {showEmailPassword
        ? (
            <button className="ghost auth-toggle" type="button" onClick={onToggleMode}>
              {authMode === 'signin'
                ? 'Need an account? Sign up'
                : 'Already have an account? Sign in'}
            </button>
          )
        : null}
    </section>
  )
}
