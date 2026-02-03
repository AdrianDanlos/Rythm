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
          <h3>Privacy</h3>
          <p>
            We only collect the data you enter and use it to provide your
            insights. We do not sell your data.
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
