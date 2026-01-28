# Rythm

## Environment variables

##### Frontend (Vite)

These live in your local `.env` (dev) and your hosting provider (prod).

- `VITE_SUPABASE_URL`: Supabase project URL.
  - Dev: local URL from `npx supabase start` (typically `http://localhost:54321`).
  - Prod: hosted Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: Supabase anon key.
  - Dev: local anon key from `npx supabase start` output or `supabase/.env`.
  - Prod: hosted Supabase anon key from the project settings.

##### Google Auth accounts

- Prod Google auth account: `danlosadrian@gmail.com`
- Dev Google auth account: `adrianf1team@gmail.com`

##### Edge Functions (Supabase secrets)

These are set per Supabase project using `npx supabase secrets set` and are not stored in the repo.

- `SUPABASE_URL`: Project URL the function should target.
  - Dev: local Supabase URL when serving functions locally.
  - Prod: hosted Supabase project URL.
- `SUPABASE_ANON_KEY`: Anon key for the target project.
  - Dev: local anon key.
  - Prod: hosted anon key.
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (prod and dev each have their own).
- `STRIPE_SECRET_KEY`: Stripe secret API key.
  - Dev: `sk_test_...`
  - Prod: `sk_live_...`
- `STRIPE_PRICE_ID`: Stripe price ID.
  - Dev: test price.
  - Prod: live price.
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret.
  - Dev: local `stripe listen` secret.
  - Prod: webhook secret from Stripe Dashboard.
- `STRIPE_SUCCESS_URL`: Redirect after successful checkout.
  - Dev: `http://localhost:5173/success`
  - Prod: `https://<your-domain>/success`
- `STRIPE_CANCEL_URL`: Redirect after cancel.
  - Dev: `http://localhost:5173/cancel`
  - Prod: `https://<your-domain>/cancel`

### Supabase + Strip: Dev vs Prod

##### Local development

1. Start local Supabase:
   - `npx supabase start`
2. Seed test data:
   - Run the content of `supabase/seed.sql` in `http://localhost:54323/project/default/sql`, which is an in-browser SQL editor in Supabase Studio.
3. Serve Edge Functions locally:
   - `npx supabase functions serve --env-file supabase/.env`
4. Forward Stripe webhooks to local:
   - `stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook`
5. Run the React app (Vite dev server):
   - `npm run dev`

##### Production

1. Point the app at the prod Supabase project:
   - Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your Vercel.
2. Deploy Edge Functions to the prod project:
   - `npx supabase functions deploy create-checkout-session`
   - `npx supabase functions deploy submit-feedback --no-verify-jwt`
   - `npx supabase functions deploy stripe-webhook --no-verify-jwt`
3. Set Supabase secrets in the prod project:
   - `npx supabase secrets set STRIPE_SECRET_KEY=sk_live_...`
   - `npx supabase secrets set STRIPE_PRICE_ID=price_...`
   - `npx supabase secrets set STRIPE_SUCCESS_URL=https://<your-domain>/success`
   - `npx supabase secrets set STRIPE_CANCEL_URL=https://<your-domain>/cancel`
   - `npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`
4. Configure the Stripe webhook:
   - Endpoint URL: `https://mdruanwmwapdaecrayyi.functions.supabase.co/stripe-webhook`
   - Events: `checkout.session.completed`

## How payments and Pro work

The Pro upgrade uses two Supabase Edge Functions plus Stripe:

1. `create-checkout-session`
   - Called from the frontend when you click **Upgrade**.
   - Reads the current Supabase user from the auth token.
   - Creates a Stripe Checkout Session with:
     - `STRIPE_PRICE_ID`
     - `STRIPE_SUCCESS_URL` / `STRIPE_CANCEL_URL`
     - `metadata.supabase_user_id = <user.id>`
   - Returns `session.url` to the frontend, which redirects the browser to Stripe Checkout.

2. `stripe-webhook`
   - Called by Stripe when a payment succeeds (`checkout.session.completed`).
   - Verifies the event with `STRIPE_WEBHOOK_SECRET`.
   - Reads `session.metadata.supabase_user_id`.
   - Uses the Supabase **service role** key to set `app_metadata.is_pro = true` for that user.

The app and Edge Functions talk to local Supabase in development and the remote Supabase project in production. Stripe webhooks point at `https://mdruanwmwapdaecrayyi.functions.supabase.co/stripe-webhook` for production.

### App development

- **Run the React app (Vite dev server)**:
  - `npm run dev`
