import './Privacy.css'
import './DeleteAccount.css'
import { AppHeader } from '../../components/AppHeader'

const SUPPORT_EMAIL = 'danlosadrian@gmail.com'
const MAILTO_URL = `mailto:${SUPPORT_EMAIL}?subject=Request%20to%20delete%20my%20Rythm%20account`

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

export function DeleteAccountPage() {
  return (
    <div className="app delete-account-page">
      <AppHeader
        session={null}
        canManageSubscription={false}
        isPortalLoading={false}
        isSignOutLoading={false}
        onOpenSettings={() => {}}
        onManageSubscription={() => {}}
        onSignOut={() => {}}
      />

      <main className="delete-account-page__main privacy-landing__content">
        <h2 className="delete-account-page__headline">Delete your account and data</h2>
        <p className="privacy-landing__lede">
          You can request permanent deletion of your Rythm account and all
          associated data (logs, insights, and preferences).
        </p>

        <section className="delete-account-page__section" aria-labelledby="delete-request-title">
          <h3 id="delete-request-title" className="delete-account-page__section-title">
            How to request deletion
          </h3>
          <p>
            Send an email from the address linked to your Rythm account. Use the
            subject line &quot;Request to delete my Rythm account&quot; or clearly state
            that you want your account and data deleted.
          </p>
          <div className="delete-account-page__email-wrap">
            <a
              href={MAILTO_URL}
              className="delete-account-page__email-link"
            >
              <MailIcon />
              {SUPPORT_EMAIL}
            </a>
          </div>
          <p className="delete-account-page__note">
            We’ll process your request and confirm once your account and data
            have been removed, usually within 30 days.
          </p>
        </section>

        <div className="delete-account-page__actions">
          <a className="delete-account-page__secondary" href="/">
            Back to app
          </a>
        </div>
      </main>
    </div>
  )
}
