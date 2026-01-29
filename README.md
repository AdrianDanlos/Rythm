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
  - Prod: `https://rythm-one.vercel.app//success`
- `STRIPE_CANCEL_URL`: Redirect after cancel.
  - Dev: `http://localhost:5173/cancel`
  - Prod: `https://rythm-one.vercel.app//cancel`
- `STRIPE_PORTAL_RETURN_URL`: Return URL for the Stripe customer portal.
  - Dev: `http://localhost:5173`
  - Prod: `https://rythm-one.vercel.app/`

##### Google Auth accounts

- Prod Google auth account: `danlosadrian@gmail.com`
- Dev Google auth account: `adrianf1team@gmail.com`

### Supabase + Strip: Dev vs Prod

##### Local development

1. Start local Supabase:
   - `npx supabase start`
2. Seed test data:
   - Run the content of `supabase/seed.sql` in `http://localhost:54323/project/default/sql`, which is an in-browser SQL editor in Supabase Studio.
3. Serve Edge Functions locally:
   - `npx supabase functions serve --env-file supabase/.env --no-verify-jwt`
4. Forward Stripe webhooks to local:
   - `stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook`
5. Run the React app (Vite dev server):
   - `npm run dev`

##### Production

1. Point the app at the prod Supabase project:
   - Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your Vercel.
2. Deploy Edge Functions to the prod project:
   - `npx supabase functions deploy create-checkout-session`
   - `npx supabase functions deploy create-portal-session --no-verify-jwt`
   - `npx supabase functions deploy submit-feedback --no-verify-jwt`
   - `npx supabase functions deploy stripe-webhook --no-verify-jwt`
3. Set Supabase secrets in the prod project:
   - `npx supabase secrets set STRIPE_SECRET_KEY=sk_live_...`
   - `npx supabase secrets set STRIPE_PRICE_ID=price_...`
   - `npx supabase secrets set STRIPE_SUCCESS_URL=https://rythm-one.vercel.app//success`
   - `npx supabase secrets set STRIPE_CANCEL_URL=https://rythm-one.vercel.app//cancel`
   - `npx supabase secrets set STRIPE_PORTAL_RETURN_URL=https://rythm-one.vercel.app/`
   - `npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`
4. Configure the Stripe webhook:
   - Endpoint URL: `https://mdruanwmwapdaecrayyi.functions.supabase.co/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

## How payments and Pro work (simple flow)

**Click Upgrade → get checkout URL → pay in Stripe → webhook marks you Pro → app refreshes session.**

1. **Frontend: user clicks Upgrade**
   - `PaywallModal` triggers the upgrade handler in `App`.
   - `App` calls the Supabase Edge Function `create-checkout-session`.

2. **Edge Function: create checkout session**
   - `create-checkout-session` validates the user token.
   - Creates a Stripe Checkout Session (subscription) using `STRIPE_PRICE_ID`.
   - Returns `session.url` to the frontend.

3. **Stripe: user completes payment**
   - Browser is redirected to Stripe Checkout.
   - After payment, Stripe calls our webhook.

4. **Edge Function: webhook marks Pro**
   - `stripe-webhook` verifies the event (`STRIPE_WEBHOOK_SECRET`).
   - Reads `session.metadata.supabase_user_id`.
   - Sets `app_metadata.is_pro = true` and stores Stripe IDs.
   - Handles cancel/updates by setting `is_pro = false` when needed.

5. **Frontend: refresh session**
   - User returns to `/success`.
   - `App` refreshes the Supabase session so Pro features unlock.

**Manage subscription**

- `create-portal-session` opens Stripe’s customer portal for users with a stored `stripe_customer_id`.

The app and Edge Functions talk to local Supabase in development and the remote Supabase project in production. Stripe webhooks point at `https://mdruanwmwapdaecrayyi.functions.supabase.co/stripe-webhook` for production.

### App development

- **Run the React app (Vite dev server)**:
  - `npm run dev`
