# Billing (Stripe + Google Play)

- **`stripe/`** – Web (Stripe): landing page, checkout/portal routes.
- **`play/`** – Mobile (Google Play): subscription product config.
- **`shared/`** – Paywall UI, billing actions hook, pricing label; used by both.

Supabase functions follow the same split by name:

- **Stripe (web):** `stripe-checkout-session`, `stripe-portal-session`, `stripe-webhook`
- **Play (mobile):** `play-verify-purchase`, `play-rtdn`
