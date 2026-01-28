# Rythm

## Environment variables

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
- `VITE_UPGRADE_URL`: Link to your checkout/paywall page used by the Pro upgrade CTA (fallback if Edge Function fails).

## Feedback collection

The feedback modal calls a Supabase Edge Function that inserts rows into a `feedback` table and emails the feedback. Suggested schema:

```sql
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);
```

Recommended RLS policy (authenticated only, non-empty fields):

```sql
create policy "Allow feedback inserts"
on feedback
for insert
to authenticated
with check (
  auth.uid() = user_id
  and length(email) > 0
  and length(message) > 0
);
```

## Stripe + Supabase (Edge Functions)

Required environment variables for the Stripe flow:

- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Required environment variables for feedback email:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `FEEDBACK_FROM_EMAIL`
- `FEEDBACK_TO_EMAIL` (defaults to `danlosadrian@gmail.com`)

For local web testing, you can set:

- `STRIPE_SUCCESS_URL=http://localhost:5173/success`
- `STRIPE_CANCEL_URL=http://localhost:5173/cancel`

If you add mobile later, replace these with your app’s deep links.

### Supabase projects: dev vs prod

In development, the app also talks to a **remote Supabase project**, not a local Docker instance.

You should normally create **two** Supabase projects:

- `Rythm Dev` Supabase project: used by your local `npm run dev` and test Stripe keys.
- `Rythm Prod` Supabase project: used by your deployed app and live Stripe keys.

You point the app at the correct project just by changing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (and the Supabase secrets used by Edge Functions).

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

The app and Edge Functions talk to the remote Supabase project. Stripe webhooks point at `https://<project-ref>.functions.supabase.co/stripe-webhook`.

## Useful CLI commands

### Supabase project and functions

- **Authenticate CLI with Supabase**:
  - `npx supabase login`
- **Link local folder to your Supabase project**:
  - `npx supabase link`
- **Deploy Edge Functions to the remote project**:
  - `npx supabase functions deploy create-checkout-session`
  - `npx supabase functions deploy submit-feedback --no-verify-jwt`
  - `npx supabase functions deploy stripe-webhook --no-verify-jwt`

### Supabase secrets (remote project)

- **Set Stripe secrets for Edge Functions**:
  - `npx supabase secrets set STRIPE_SECRET_KEY=sk_test_...`
  - `npx supabase secrets set STRIPE_PRICE_ID=price_...`
  - `npx supabase secrets set STRIPE_SUCCESS_URL=http://localhost:5173/success`
  - `npx supabase secrets set STRIPE_CANCEL_URL=http://localhost:5173/cancel`
- **Inspect all secrets**:
  - `npx supabase secrets list`

### Stripe webhooks (production)

- **Configure webhook in Stripe Dashboard**:
  - Endpoint URL: `https://<project-ref>.functions.supabase.co/stripe-webhook`
  - Events: `checkout.session.completed`
  - Copy the webhook signing secret and set it as `STRIPE_WEBHOOK_SECRET` via `npx supabase secrets set`

### App development

- **Run the React app (Vite dev server)**:
  - `npm run dev`
