-- Revert shared challenges schema + policies.
-- Run in Supabase SQL editor to remove the feature.

do $$
declare
  policy_name text;
  table_name text;
begin
  for policy_name, table_name in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('challenges', 'challenge_members', 'challenge_checkins')
  loop
    execute format('drop policy if exists %I on public.%I', policy_name, table_name);
  end loop;
end $$;

drop table if exists public.challenge_checkins;
drop table if exists public.challenge_members;
drop table if exists public.challenges;
drop function if exists public.is_challenge_member(uuid);
