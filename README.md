# Rythm

## Environment variables

##### Frontend (Vite)

These live in your local `.env` (dev) and your hosting provider (prod).
For Android builds, use `.env.production` so the app targets hosted Supabase.

Example `.env.production`:

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<prod_anon_key>
VITE_ANDROID_UPDATE_MANIFEST_URL=https://rythm-one.vercel.app/app-version.json
```

- `VITE_SUPABASE_URL`: Supabase project URL.
  - Dev: local URL from `npx supabase start` (this project: `http://localhost:55421`).
  - Prod: hosted Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: Supabase anon key.
  - Dev: local anon key from `npx supabase start` output or `supabase/.env`.
  - Prod: hosted Supabase anon key from the project settings.
- `VITE_ANDROID_UPDATE_MANIFEST_URL`: Public URL for the Android update manifest.
  - Use: `https://rythm-one.vercel.app/app-version.json`.
  - Used by the app at runtime to check the latest available Android version.
- Optional `VITE_UPGRADE_URL`: If set, the web app uses this link for upgrade and subscription management flows when Google Play billing is not available (e.g. desktop browser).
- Before each Play Store build, bump versions with `npm run release:bump-version` (patch bump by default). This updates `android/app/build.gradle` (`versionCode` +1 and `versionName`), `public/app-version.json`, the synced Android asset copy, `package.json`, and root entries in `package-lock.json`. Use `npm run release:bump-version -- minor`, `major`, or `npm run release:bump-version -- 1.2.3` for an exact `versionName`. Optional: `node scripts/bump-release-version.mjs --dry-run` to preview.

##### Edge Functions (Supabase secrets)

These are set per Supabase project using `npx supabase secrets set` and are not stored in the repo.

- `SUPABASE_URL`: Project URL the function should target.
  - Dev: local Supabase URL when serving functions locally.
  - Prod: hosted Supabase project URL.
- `SUPABASE_ANON_KEY`: Anon key for the target project.
  - Dev: local anon key.
  - Prod: hosted anon key.
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (prod and dev each have their own).
- `RTDN_SHARED_SECRET`: Shared secret for `play-rtdn` sender trust checks.
  - Configure this in Supabase secrets.
  - Add the same value to the Pub/Sub push endpoint as `?secret=<value>`.

##### Google Auth accounts

- Prod Google auth account: `danlosadrian@gmail.com`
- Dev Google auth account: `adrianf1team@gmail.com`

##### Email and password (Supabase Auth)

The app uses `signUp`, `signInWithPassword`, `resetPasswordForEmail`, and `updateUser` for password recovery. Supabase sends confirmation and reset emails using its **default SMTP** unless you configure custom SMTP in the project.

In the [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication**: enable **Email**, set **Site URL** to your deployed origin (e.g. `https://rythm-one.vercel.app`), and under **Redirect URLs** allow that origin, `http://localhost:5173`, and any other origins you use (`capacitor://localhost`, etc.).

**Android:** Native builds use `redirect_to` = `https://rythm-one.vercel.app` (or override with `VITE_AUTH_EMAIL_REDIRECT_ORIGIN`). For reset links to open the app instead of Chrome, that `https` URL must be verified as an [Android App Link](https://developer.android.com/training/app-links): add the intent filter and host `assetlinks.json` on the site (see `public/.well-known/assetlinks.json` and `AndroidManifest.xml`). `App.tsx` applies tokens from the link via `appUrlOpen` / `getLaunchUrl()`.

**SHA-256 fingerprints** (paste into `public/.well-known/assetlinks.json` as colon-separated hex, same format keytool prints under **Certificate fingerprints** → **SHA256**):

```powershell
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

For Play Store builds, use **Play Console → App signing** (app signing certificate SHA-256), or `./gradlew signingReport` from `android/` for local release keystores.

### Supabase + Google Play: Dev vs Prod

##### Local development

1. Start local Supabase:
   - `npx supabase start`
2. Seed test data:
   - Run the content of `supabase/seed.sql` in `http://localhost:55423/project/default/sql`, which is an in-browser SQL editor in Supabase Studio.
3. Serve Edge Functions locally:
   - `npx supabase functions serve --env-file supabase/.env --no-verify-jwt`
4. Run the React app (Vite dev server):
   - `npm run dev`

##### Production

1. Point the app at the prod Supabase project:
   - Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your Vercel.
2. Deploy Edge Functions to the prod project:
   - `npx supabase functions deploy submit-feedback --no-verify-jwt`
   - `npx supabase functions deploy play-verify-purchase --no-verify-jwt`
   - `npx supabase functions deploy play-rtdn --no-verify-jwt`
3. Set Supabase secrets in the prod project:
   - `npx supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON='<service-account-json>'`
   - `npx supabase secrets set PLAY_PACKAGE_NAME=com.rythm.app`
   - `npx supabase secrets set RTDN_SHARED_SECRET=<long-random-secret>`

4. Configure Google Play purchase verification (pay action):

5. Configure Google Play RTDN Pub/Sub

## How payments and Pro work (simple flow)

**Android:** user taps Upgrade → Google Play purchase → `play-verify-purchase` (and RTDN for renewals/cancellation) updates `app_metadata.is_pro`.

**Web:** if `VITE_UPGRADE_URL` is set, Upgrade opens that URL in a new tab. Pro status for web users depends on how that external flow updates your Supabase user records (if applicable).

**Manage subscription (Android, Play Pro):** opens Google Play subscription management. **Web:** opens `VITE_UPGRADE_URL` if configured.

The app and Edge Functions talk to local Supabase in development and the remote Supabase project in production.

### Tags correlation for mood and sleep

Same-day tags correlate with mood; previous-day tags correlate with sleep.

### Android (Capacitor)

- **Before a release build** (new Play upload): run `npm run release:bump-version` so store version, `versionCode`, and update manifests stay aligned.
- **Build web assets for native**:
  - `npm run build`
- **Sync web assets and plugins to Android**:
  - `npx cap sync android`
- **Open the project in Android Studio**:
  - `npx cap open android`
- **Run on a device or emulator (optional)**:
  - `npx cap run android`

### App development

- **Run the React app (Vite dev server)**:
  - `npm run dev`
