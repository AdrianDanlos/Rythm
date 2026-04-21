-- 90 days of coherent sleep / mood / tags for local Supabase/Postgres.
-- Idempotent on (user_id, entry_date).

WITH days AS (
  SELECT generate_series(0, 89) AS day_offset
),
enriched AS (
  SELECT
    day_offset,
    (current_date - day_offset)::date AS entry_date,
    EXTRACT(DOW FROM (current_date - day_offset)::date)::int AS dow,
    abs(hashtext(((current_date - day_offset)::date)::text)) AS h
  FROM days
),
profiled AS (
  SELECT
    *,
    CASE
      WHEN dow IN (0, 6) THEN
        CASE WHEN (h % 2) = 0 THEN 'weekend_rest' ELSE 'weekend_active' END
      ELSE
        CASE (h % 7)
          WHEN 0 THEN 'solid_weekday'
          WHEN 1 THEN 'rough_night'
          WHEN 2 THEN 'caffeine_screens'
          WHEN 3 THEN 'stress_eating'
          WHEN 4 THEN 'alcohol_social'
          WHEN 5 THEN 'focus_progress'
          ELSE 'baseline'
        END
    END AS profile
  FROM enriched
)
INSERT INTO public.entries (
  user_id,
  entry_date,
  sleep_hours,
  mood,
  note,
  tags
)
SELECT
  'af6cc2ab-f860-4f98-a4e8-da08622f235c'::uuid,
  entry_date,
  round(
    CASE profile
      WHEN 'weekend_rest' THEN 8.6 + ((h % 10)::numeric / 10)
      WHEN 'weekend_active' THEN 7.4 + ((h % 8)::numeric / 10)
      WHEN 'solid_weekday' THEN 7.3 + ((h % 6)::numeric / 10)
      WHEN 'rough_night' THEN 5.3 + ((h % 9)::numeric / 10)
      WHEN 'caffeine_screens' THEN 6.0 + ((h % 10)::numeric / 10)
      WHEN 'stress_eating' THEN 6.2 + ((h % 10)::numeric / 10)
      WHEN 'alcohol_social' THEN 5.6 + ((h % 8)::numeric / 10)
      WHEN 'focus_progress' THEN 7.0 + ((h % 10)::numeric / 10)
      ELSE 6.9 + ((h % 10)::numeric / 10)
    END,
    1
  ) AS sleep_hours,
  CASE profile
    WHEN 'weekend_rest' THEN 4 + (h % 2)        -- 4 or 5
    WHEN 'weekend_active' THEN 5
    WHEN 'solid_weekday' THEN 4
    WHEN 'rough_night' THEN 2
    WHEN 'caffeine_screens' THEN 3
    WHEN 'stress_eating' THEN 2
    WHEN 'alcohol_social' THEN 3
    WHEN 'focus_progress' THEN 4
    ELSE 3
  END AS mood,
  CASE profile
    WHEN 'weekend_rest' THEN 'No alarm; slow morning. Felt recharged.'
    WHEN 'weekend_active' THEN 'Outdoors and social—tired but happy.'
    WHEN 'solid_weekday' THEN 'Consistent wind-down; steady energy.'
    WHEN 'rough_night' THEN 'Woke a lot; groggy until late morning.'
    WHEN 'caffeine_screens' THEN 'Scrolling late; wired then crashed.'
    WHEN 'stress_eating' THEN 'Heavy dinner late; mind kept racing.'
    WHEN 'alcohol_social' THEN 'Fun evening; sleep lighter than usual.'
    WHEN 'focus_progress' THEN 'Good work block; calm evening.'
    ELSE 'Ordinary day; nothing dramatic.'
  END AS note,
  CASE profile
    WHEN 'weekend_rest' THEN ARRAY['weekend', 'recovery']::text[]
    WHEN 'weekend_active' THEN ARRAY['social', 'sunlight', 'exercise']::text[]
    WHEN 'solid_weekday' THEN ARRAY['exercise', 'sunlight']::text[]
    WHEN 'rough_night' THEN ARRAY['fragmented sleep', 'late bedtime']::text[]
    WHEN 'caffeine_screens' THEN ARRAY['caffeine', 'evening screens']::text[]
    WHEN 'stress_eating' THEN ARRAY['stress', 'late eating']::text[]
    WHEN 'alcohol_social' THEN ARRAY['alcohol consumption', 'social']::text[]
    WHEN 'focus_progress' THEN ARRAY['progress feeling']::text[]
    ELSE ARRAY['baseline']::text[]
  END AS tags
FROM profiled
ON CONFLICT (user_id, entry_date) DO UPDATE SET
  sleep_hours = excluded.sleep_hours,
  mood = excluded.mood,
  note = excluded.note,
  tags = excluded.tags;

-- Pro for app_metadata (useBillingState reads is_pro). Requires privileges on auth.users (e.g. SQL editor as postgres).
UPDATE auth.users
SET
  raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('is_pro', true)
WHERE
  id = 'af6cc2ab-f860-4f98-a4e8-da08622f235c'::uuid;