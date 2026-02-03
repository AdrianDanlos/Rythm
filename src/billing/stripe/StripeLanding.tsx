import './StripeLanding.css'

type StripeLandingProps = {
  logo: string
}

export function StripeLanding({ logo }: StripeLandingProps) {
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
        <h2>Track your sleep, mood, and daily habits.</h2>
        <p className="stripe-landing__lede">
          Rythm helps you understand how your sleep impacts your mood, so you
          can build healthier routines over time.
        </p>

        <section className="stripe-landing__section">
          <h3>Key features</h3>
          <ul>
            <li>Daily sleep and mood logging</li>
            <li>Insights and trends over time</li>
            <li>Exportable reports and CSV downloads</li>
          </ul>
        </section>

        <section className="stripe-landing__section">
          <h3>Pricing</h3>
          <p>Free plan available. Pro unlocks advanced insights and exports.</p>
        </section>

        <section className="stripe-landing__section">
          <h3>Support</h3>
          <p>
            Email us at <a href="mailto:danlosadrian@gmail.com">danlosadrian@gmail.com</a>.
          </p>
        </section>

        <section className="stripe-landing__section" id="privacy">
          <h3>Privacy Policy</h3>
          <p>
            This policy describes how Rythm (“we”) collects, uses, and protects
            your information. By using Rythm, you agree to this policy.
          </p>
          <h4>Data we collect</h4>
          <p>
            We collect the data you provide: email address (for your account),
            sleep and mood logs, optional profile details (e.g. name, sleep
            target), and preferences (e.g. date format, theme). On mobile we may
            receive device-related data necessary to provide the app (e.g. for
            in-app purchases and notifications).
          </p>
          <h4>How we use it</h4>
          <p>
            We use your data to run the app: to store your logs, generate
            insights and trends, and enable exports. We use your email to
            manage your account and, if you choose, to send you product updates.
            We do not sell your data to third parties.
          </p>
          <h4>Where your data is stored</h4>
          <p>
            Your account and log data are stored and processed by Supabase. If
            you subscribe on the web, payment data is processed by Stripe. On
            Android, in-app subscriptions are handled by Google Play. We do not
            store your payment card details.
          </p>
          <h4>Your rights</h4>
          <p>
            You can access and export your data from within the app. You may
            request deletion of your account and data by contacting us at{' '}
            <a href="mailto:danlosadrian@gmail.com">danlosadrian@gmail.com</a>.
          </p>
          <h4>Updates</h4>
          <p>
            We may update this policy from time to time. The current version is
            always available at this page. Continued use of Rythm after changes
            means you accept the updated policy.
          </p>
          <p>
            For privacy-related questions, contact us at{' '}
            <a href="mailto:danlosadrian@gmail.com">danlosadrian@gmail.com</a>.
          </p>
        </section>

        <section className="stripe-landing__section" id="terms">
          <h3>Terms</h3>
          <p>
            Use Rythm for personal wellness tracking. You can cancel any paid
            plan at any time.
          </p>
        </section>

        <div className="stripe-landing__actions">
          <a className="stripe-landing__primary" href="/">
            Sign in to the app
          </a>
        </div>
      </main>
    </div>
  )
}
