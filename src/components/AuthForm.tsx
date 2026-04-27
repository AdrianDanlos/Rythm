import type { FormEvent, ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import googleLogo from '../assets/google-logo.png'

function AndroidAuthChrome({
  children,
  title,
}: {
  children: ReactNode
  title?: string
}) {
  const { t } = useTranslation()
  const heading = title ?? t('auth.welcome')

  return (
    <div className="native-auth-screen">
      <div className="native-auth-screen__inner native-auth-screen__inner--form">
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
        <h1 className="native-auth-screen__title">{heading}</h1>
        <div
          className="native-auth-screen__divider native-auth-screen__divider--under-title"
          role="presentation"
        >
          <span className="native-auth-screen__divider-line" />
          <span className="native-auth-screen__divider-text">{t('auth.secureData')}</span>
          <span className="native-auth-screen__divider-line" />
        </div>
        {children}
      </div>
    </div>
  )
}

export type EmailAuthFlow = 'credentials' | 'forgot' | 'verifyPending'

type AuthFormProps = {
  authMode: 'signin' | 'signup'
  authEmail: string
  authPassword: string
  authLoading: boolean
  emailFlow: EmailAuthFlow
  onEmailFlowChange: (flow: EmailAuthFlow) => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent) => void
  onForgotSubmit: (event: FormEvent) => void
  onResendVerification: () => void
  onBackFromVerifyPending: () => void
  onGoogleSignIn: () => void
  onTryWithoutAccount: () => void
  onToggleMode: () => void
}

export function VerifyEmailScreen({
  email,
  authLoading,
  onResend,
  onBackToSignIn,
  onSignOut,
}: {
  email: string
  authLoading: boolean
  onResend: () => void
  onBackToSignIn?: () => void
  onSignOut?: () => void
}) {
  const { t } = useTranslation()

  return (
    <AndroidAuthChrome title={t('auth.verifyEmailTitle')}>
      <p className="native-auth-screen__chrome-lead">{t('auth.verifyEmailBody', { email })}</p>
      <div className="stack native-auth-screen__form-stack">
        <button
          type="button"
          className="native-auth-screen__primary-submit"
          disabled={authLoading}
          onClick={onResend}
        >
          {authLoading ? t('auth.working') : t('auth.verifyEmailResend')}
        </button>
        {onBackToSignIn
          ? (
              <button className="native-auth-screen__text-link" type="button" onClick={onBackToSignIn}>
                {t('auth.backToSignIn')}
              </button>
            )
          : null}
        {onSignOut
          ? (
              <button className="native-auth-screen__text-link" type="button" disabled={authLoading} onClick={onSignOut}>
                {t('auth.verifyEmailSignOut')}
              </button>
            )
          : null}
      </div>
    </AndroidAuthChrome>
  )
}

export function PasswordRecoveryForm({
  authLoading,
  onSubmit,
}: {
  authLoading: boolean
  onSubmit: (event: FormEvent, newPassword: string) => void
}) {
  const { t } = useTranslation()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const newPasswordTooShort = newPassword.length > 0 && newPassword.length < 6
  const passwordsMismatch
    = newPassword.length > 0
      && confirmPassword.length > 0
      && newPassword !== confirmPassword
      && !newPasswordTooShort

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (newPassword.length < 6) {
      return
    }
    if (newPassword !== confirmPassword) {
      return
    }
    onSubmit(event, newPassword)
  }

  return (
    <AndroidAuthChrome title={t('auth.setNewPassword')}>
      <p className="native-auth-screen__chrome-lead">{t('auth.setNewPasswordHint')}</p>
      <form onSubmit={handleSubmit} className="stack native-auth-screen__form-stack">
        <label className="field">
          {t('auth.newPassword')}
          <input
            type="password"
            value={newPassword}
            onChange={event => setNewPassword(event.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>
        <label className="field">
          {t('auth.confirmNewPassword')}
          <input
            type="password"
            value={confirmPassword}
            onChange={event => setConfirmPassword(event.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>
        {newPasswordTooShort
          ? (
              <p className="field-hint field-hint--error" role="alert">
                {t('auth.newPasswordTooShort')}
              </p>
            )
          : null}
        {passwordsMismatch
          ? (
              <p className="field-hint field-hint--error" role="alert">
                {t('auth.passwordMismatch')}
              </p>
            )
          : null}
        <button
          type="submit"
          disabled={
            authLoading
            || newPassword.length < 6
            || newPassword !== confirmPassword
          }
        >
          {authLoading ? t('auth.working') : t('auth.saveNewPassword')}
        </button>
      </form>
    </AndroidAuthChrome>
  )
}

export const AuthForm = ({
  authMode,
  authEmail,
  authPassword,
  authLoading,
  emailFlow,
  onEmailFlowChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onForgotSubmit,
  onResendVerification,
  onBackFromVerifyPending,
  onGoogleSignIn,
  onTryWithoutAccount,
  onToggleMode,
}: AuthFormProps) => {
  const { t } = useTranslation()

  if (emailFlow === 'verifyPending') {
    return (
      <VerifyEmailScreen
        email={authEmail.trim()}
        authLoading={authLoading}
        onResend={onResendVerification}
        onBackToSignIn={onBackFromVerifyPending}
      />
    )
  }

  if (emailFlow === 'forgot') {
    return (
      <AndroidAuthChrome title={t('auth.forgotPasswordTitle')}>
        <p className="native-auth-screen__chrome-lead">{t('auth.forgotPasswordBody')}</p>
        <form onSubmit={onForgotSubmit} className="stack native-auth-screen__form-stack">
          <label className="field">
            {t('auth.email')}
            <input
              type="email"
              value={authEmail}
              onChange={event => onEmailChange(event.target.value)}
              placeholder={t('auth.email')}
              required
              autoComplete="email"
            />
          </label>
          <button
            type="submit"
            className="native-auth-screen__primary-submit"
            disabled={authLoading}
          >
            {authLoading ? t('auth.working') : t('auth.sendResetLink')}
          </button>
        </form>
        <button
          className="native-auth-screen__text-link"
          type="button"
          onClick={() => onEmailFlowChange('credentials')}
        >
          {t('auth.backToSignIn')}
        </button>
      </AndroidAuthChrome>
    )
  }

  return (
    <AndroidAuthChrome>
      <div className="native-auth-screen__form-block">
        <form onSubmit={onSubmit} className="stack native-auth-screen__form-stack">
          <label className="field">
            {t('auth.email')}
            <input
              type="email"
              value={authEmail}
              onChange={event => onEmailChange(event.target.value)}
              placeholder={t('auth.email')}
              required
              autoComplete="email"
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
              autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
              title={authMode === 'signup' ? t('auth.passwordMinLength') : undefined}
            />
          </label>
          <div className="auth-password-extras auth-password-extras--android" aria-live="polite">
            {authMode === 'signup'
              ? (
                  <span className="field-hint">
                    {t('auth.passwordMinLength')}
                  </span>
                )
              : (
                  <button
                    className="auth-forgot-link"
                    type="button"
                    onClick={() => onEmailFlowChange('forgot')}
                  >
                    {t('auth.forgotPassword')}
                  </button>
                )}
          </div>
          <button type="submit" className="native-auth-screen__primary-submit" disabled={authLoading}>
            <span className="native-auth-screen__btn-content">
              {authLoading
                ? t('auth.working')
                : authMode === 'signin'
                  ? t('auth.signIn')
                  : t('auth.signUp')}
            </span>
          </button>
        </form>
      </div>
      <button
        className="native-auth-screen__google-btn"
        type="button"
        disabled={authLoading}
        onClick={(event) => {
          event.stopPropagation()
          onGoogleSignIn()
        }}
      >
        <span className="native-auth-screen__btn-row">
          <img className="native-auth-screen__google-logo" src={googleLogo} alt="" />
          <span className="native-auth-screen__btn-text">{t('auth.continueWithGoogle')}</span>
        </span>
      </button>
      <div className="native-auth-screen__footer-links">
        <button
          className="native-auth-screen__text-link native-auth-screen__text-link--toggle"
          type="button"
          onClick={onToggleMode}
        >
          {authMode === 'signin'
            ? t('auth.needAccount')
            : t('auth.alreadyHaveAccount')}
        </button>
        <button
          type="button"
          className="native-auth-screen__guest-text-link"
          disabled={authLoading}
          onClick={onTryWithoutAccount}
        >
          {t('auth.tryWithoutSigningIn')}
        </button>
      </div>
    </AndroidAuthChrome>
  )
}
