# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Rythm is a mood/sleep tracking web app (React 19 + Vite 7 + TypeScript) backed by Supabase (PostgreSQL, Auth, Edge Functions). See `README.md` for environment variable docs and the full local dev workflow.

### Key commands

| Task | Command |
|---|---|
| Dev server | `npm run dev` (port 5173) |
| Lint | `npm run lint` |
| Tests | `npm run test:run` (Vitest, 27 tests) |
| Build | `npm run build` |
| Supabase start | `sudo env "PATH=$PATH" npx supabase start` |
| Supabase stop | `sudo env "PATH=$PATH" npx supabase stop` |

### Gotchas

- **Docker required**: Supabase local runs via Docker. The Docker daemon must be started with `sudo dockerd` before running `npx supabase start`. In the Cloud Agent VM, Docker uses `fuse-overlayfs` storage driver and `iptables-legacy` (configured in `/etc/docker/daemon.json`).
- **`sudo` + `npx`**: The `npx` binary is under nvm, so Supabase CLI commands need `sudo env "PATH=$PATH" npx supabase ...` to pass the nvm-managed PATH to the privileged Docker socket.
- **Missing `entries` table migration**: The repo has `supabase/seed.sql` referencing `public.entries` but no migration creates it. After `supabase start`, create it manually:
  ```sql
  CREATE TABLE IF NOT EXISTS public.entries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entry_date date NOT NULL,
    sleep_hours numeric,
    mood integer,
    note text,
    tags text[],
    is_complete boolean NOT NULL DEFAULT false,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, entry_date)
  );
  ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can manage own entries" ON public.entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  ```
  Run via: `sudo docker exec -i supabase_db_Rythm psql -U postgres -d postgres -c "<sql>"`. Alternatively, temporarily set `db.seed.enabled = false` in `supabase/config.toml` before starting, then create the table afterward.
- **`.env` file**: Must exist at the repo root with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The anon key comes from `npx supabase status` output. For local dev: `VITE_SUPABASE_URL=http://localhost:55421`.
- **Lint has pre-existing style errors** (97 errors in the existing code). These are all `@stylistic` formatting issues and do not block the build or tests.
- **Google OAuth warnings**: `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` are unset locally; these warnings from `supabase start` are harmless for local email/password auth development.
