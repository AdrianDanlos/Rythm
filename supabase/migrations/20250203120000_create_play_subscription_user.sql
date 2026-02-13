-- Map Google Play purchase tokens to Supabase user IDs for RTDN (Real-time developer notifications).
-- When a subscription is canceled/expired/revoked, we look up the user and clear is_pro.
CREATE TABLE IF NOT EXISTS public.play_subscription_user (
  purchase_token text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS play_subscription_user_user_id_idx ON public.play_subscription_user(user_id);
ALTER TABLE public.play_subscription_user ENABLE ROW LEVEL SECURITY;
--- Only service role (used by Edge Functions) can read/write; anon and authenticated cannot.
CREATE POLICY "Service role only for play_subscription_user" ON public.play_subscription_user FOR ALL USING (false) WITH CHECK (false);
COMMENT ON TABLE public.play_subscription_user IS 'Maps Google Play subscription purchase tokens to Supabase auth users for RTDN revocation handling';