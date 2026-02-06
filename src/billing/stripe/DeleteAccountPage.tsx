import './StripeLanding.css'

const SUPPORT_EMAIL = 'danlosadrian@gmail.com'

type DeleteAccountPageProps = {
  logo: string
}

export function DeleteAccountPage({ logo }: DeleteAccountPageProps) {
  return (
    <div className="stripe-landing">
      <header className="stripe-landing__header">
        <img className="stripe-landing__logo" src={logo} alt="Rythm logo" />
        <div>
          <p className="stripe-landing__eyebrow">Sleep &amp; Mood</p>
          <h1 className="stripe-landing__title">Rythm</h1>
        </div>
      </header>

      <main className="stripe-landing__content">
        <h2>Delete your account and data</h2>
        <p className="stripe-landing__lede">
          You can request permanent deletion of your Rythm account and all
          associated data (logs, insights, and preferences).
        </p>

        <section className="stripe-landing__section">
          <h3>How to request deletion</h3>
          <p>
            Send an email from the address linked to your Rythm account to{' '}
            <a href={`mailto:${SUPPORT_EMAIL}?subject=Request%20to%20delete%20my%20Rythm%20account`}>
              {SUPPORT_EMAIL}
            </a>
            . Use the subject line &quot;Request to delete my Rythm account&quot; or
            clearly state that you want your account and data deleted.
          </p>
          <p>
            We will process your request and confirm once your account and data
            have been removed, usually within 30 days.
          </p>
        </section>

        <div className="stripe-landing__actions">
          <a className="stripe-landing__primary" href="/">
            Back to app
          </a>
        </div>
      </main>
    </div>
  )
}
