# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Environment variables

- `VITE_SUPABASE_URL`: Your Supabase project URL (production)
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key (production)
- `VITE_SUPABASE_LOCAL_ANON_KEY`: (Optional) Local Supabase anon key for local testing. When running `supabase start`, copy the anon key from the output and set this variable.
- `VITE_UPGRADE_URL`: Link to your checkout/paywall page used by the Pro upgrade CTA (fallback if Edge Function fails).

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

For local web testing, you can set:
- `STRIPE_SUCCESS_URL=http://localhost:5173/success`
- `STRIPE_CANCEL_URL=http://localhost:5173/cancel`

If you add mobile later, replace these with your app’s deep links.

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

In development, the app and Edge Functions talk to **local Supabase** (`http://127.0.0.1:54321`) using the publishable/secret keys printed by `supabase start`. In production, they talk to the remote Supabase project using production keys, and Stripe webhooks point at `https://<project-ref>.functions.supabase.co/stripe-webhook`.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
