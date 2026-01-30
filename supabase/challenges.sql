-- Shared challenges schema + policies.
-- Run in Supabase SQL editor to create required tables.

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '7-day sleep + mood challenge',
  invite_code text not null unique,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.challenge_members (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);

create table if not exists public.challenge_checkins (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  created_at timestamptz not null default now(),
  unique (challenge_id, user_id, entry_date)
);

alter table public.challenges enable row level security;
alter table public.challenge_members enable row level security;
alter table public.challenge_checkins enable row level security;

-- Helper to check membership without RLS recursion.
create or replace function public.is_challenge_member(target_challenge_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.challenge_members
    where challenge_id = target_challenge_id
      and user_id = auth.uid()
  )
  or exists (
    select 1
    from public.challenges
    where id = target_challenge_id
      and owner_id = auth.uid()
  );
end;
$$;

grant execute on function public.is_challenge_member(uuid) to authenticated;

drop policy if exists "challenges select for authenticated" on public.challenges;
drop policy if exists "challenges insert for owners" on public.challenges;
drop policy if exists "challenges update for owners" on public.challenges;
drop policy if exists "challenges delete for owners" on public.challenges;
drop policy if exists "members read for challenge" on public.challenge_members;
drop policy if exists "members insert self" on public.challenge_members;
drop policy if exists "checkins read for challenge" on public.challenge_checkins;
drop policy if exists "checkins insert self" on public.challenge_checkins;
drop policy if exists "checkins update self" on public.challenge_checkins;

-- Allow authenticated users to read challenges so invite codes can be redeemed.
create policy "challenges select for authenticated"
  on public.challenges
  for select
  using (auth.uid() is not null);

create policy "challenges insert for owners"
  on public.challenges
  for insert
  with check (auth.uid() = owner_id);

create policy "challenges update for owners"
  on public.challenges
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "challenges delete for owners"
  on public.challenges
  for delete
  using (auth.uid() = owner_id);

create policy "members read for challenge"
  on public.challenge_members
  for select
  using (public.is_challenge_member(challenge_id));

create policy "members insert self"
  on public.challenge_members
  for insert
  with check (auth.uid() = user_id);

create policy "checkins read for challenge"
  on public.challenge_checkins
  for select
  using (public.is_challenge_member(challenge_id));

create policy "checkins insert self"
  on public.challenge_checkins
  for insert
  with check (auth.uid() = user_id);

create policy "checkins update self"
  on public.challenge_checkins
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
