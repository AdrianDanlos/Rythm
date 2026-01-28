-- Seed data for the entries table.
-- Replace the user_id with a real auth.users id before running.
-- Safe to re-run thanks to ON CONFLICT.
with day_series as (
  select generate_series(0, 364) as day_offset
),
rand as (
  select day_offset,
    random() as r_sleep,
    random() as r_mood,
    random() as r_note,
    random() as r_tags
  from day_series
)
insert into public.entries (
    user_id,
    entry_date,
    sleep_hours,
    mood,
    note,
    tags
  )
select '9e6ae355-9ec0-49b2-9bf5-4809d19589ca',
  (current_date - day_offset)::date,
  round((5.5 + r_sleep * 3.5)::numeric, 1),
  (floor(r_mood * 5) + 1)::int,
  case
    when r_note < 0.12 then 'Weekend recharge.'
    when r_note < 0.24 then 'Late screen time, felt groggy.'
    when r_note < 0.36 then 'Morning run helped.'
    when r_note < 0.48 then 'Solid focus, light evening workout.'
    when r_note < 0.60 then 'Evening caffeine.'
    when r_note < 0.72 then 'Stressful day; skipped lunch.'
    when r_note < 0.84 then 'Productive and calm.'
    else null
  end,
  case
    when r_tags < 0.12 then array ['weekend','recovery']::text []
    when r_tags < 0.24 then array ['late-night','screen']::text []
    when r_tags < 0.36 then array ['workout','morning']::text []
    when r_tags < 0.48 then array ['workout','focus']::text []
    when r_tags < 0.60 then array ['caffeine']::text []
    when r_tags < 0.72 then array ['stress','skipped-meal']::text []
    when r_tags < 0.84 then array ['focus']::text []
    else array ['baseline']::text []
  end
from rand on conflict (user_id, entry_date) do
update
set sleep_hours = excluded.sleep_hours,
  mood = excluded.mood,
  note = excluded.note,
  tags = excluded.tags;