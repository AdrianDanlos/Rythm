import type { FormEvent } from 'react'
import googleLogo from '../assets/google-logo.png'

type AuthFormProps = {
  authMode: 'signin' | 'signup'
  authEmail: string
  authPassword: string
  authLoading: boolean
  authError: string | null
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
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onGoogleSignIn,
  onToggleMode,
}: AuthFormProps) => (
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
        />
      </label>
      {authError ? <p className="error">{authError}</p> : null}
      <button type="submit" disabled={authLoading}>
        {authLoading
          ? 'Working...'
          : authMode === 'signin'
            ? 'Sign in'
            : 'Sign up'}
      </button>
    </form>
    <button className="ghost oauth-button" type="button" onClick={onGoogleSignIn}>
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
