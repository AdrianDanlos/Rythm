import * as Sentry from '@sentry/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { t } from 'i18next'
import './index.css'
import './i18n'
import App from './App.tsx'

// Set VITE_SENTRY_DSN in .env (from Sentry project settings) to enable error reporting.
const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
    tracePropagationTargets: ['localhost', /^https:\/\/.*\.supabase\.co\/rest/],
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => (
        <div style={{ padding: 24, textAlign: 'center', fontFamily: 'system-ui' }}>
          <p>{t('errors.somethingWentWrong')}</p>
          <button type="button" onClick={resetError} style={{ marginTop: 12 }}>
            {t('errors.tryAgain')}
          </button>
        </div>
      )}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
