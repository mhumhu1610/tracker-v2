-- Team Capacity Dashboard — schema, 8 teams, role-based access
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- ---------------------------------------------------------------------------
-- Teams (8)
-- ---------------------------------------------------------------------------
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

insert into public.teams (slug, name) values
  ('ad', 'AD'),
  ('pod-a', 'Pod A'),
  ('pod-b', 'Pod B'),
  ('pod-a-b', 'Pod A + B'),
  ('pod-b-a', 'Pod B + A'),
  ('shared', 'Shared'),
  ('client-services', 'Client Services'),
  ('internal-ops', 'Internal Ops')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('member', 'team_admin');
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Profiles (linked to auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  team_id uuid not null references public.teams (id),
  role public.app_role not null default 'member',
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_team_id_idx on public.profiles (team_id);

-- Auto-create profile from sign-up metadata (team_slug, role, full_name)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_role public.app_role;
begin
  select id into v_team_id
  from public.teams
  where slug = coalesce(new.raw_user_meta_data->>'team_slug', '');

  if v_team_id is null then
    raise exception 'Invalid or missing team_slug in user metadata';
  end if;

  v_role := coalesce(
    (new.raw_user_meta_data->>'role')::public.app_role,
    'member'::public.app_role
  );

  insert into public.profiles (id, team_id, role, full_name, email)
  values (
    new.id,
    v_team_id,
    v_role,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Capacity sheets (one per team per period)
-- ---------------------------------------------------------------------------
create table if not exists public.capacity_sheets (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  month text not null,
  year int not null,
  projects jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, month, year)
);

create table if not exists public.capacity_members (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid not null references public.capacity_sheets (id) on delete cascade,
  name text not null default '',
  pod text not null default '',
  job_role text not null default '',
  allocations jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists capacity_members_sheet_id_idx
  on public.capacity_members (sheet_id);

-- ---------------------------------------------------------------------------
-- RLS helpers
-- ---------------------------------------------------------------------------
create or replace function public.current_team_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select team_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_team_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'team_admin'::public.app_role, false)
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.teams enable row level security;
alter table public.profiles enable row level security;
alter table public.capacity_sheets enable row level security;
alter table public.capacity_members enable row level security;

-- Teams: users only see their own team
drop policy if exists "teams_select_own" on public.teams;
create policy "teams_select_own"
  on public.teams for select to authenticated
  using (id = public.current_team_id());

-- Profiles: users only see their own profile
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Capacity sheets
drop policy if exists "sheets_select_own_team" on public.capacity_sheets;
create policy "sheets_select_own_team"
  on public.capacity_sheets for select to authenticated
  using (team_id = public.current_team_id());

drop policy if exists "sheets_insert_admin" on public.capacity_sheets;
create policy "sheets_insert_admin"
  on public.capacity_sheets for insert to authenticated
  with check (
    team_id = public.current_team_id()
    and public.is_team_admin()
  );

drop policy if exists "sheets_update_admin" on public.capacity_sheets;
create policy "sheets_update_admin"
  on public.capacity_sheets for update to authenticated
  using (team_id = public.current_team_id() and public.is_team_admin())
  with check (team_id = public.current_team_id() and public.is_team_admin());

drop policy if exists "sheets_delete_admin" on public.capacity_sheets;
create policy "sheets_delete_admin"
  on public.capacity_sheets for delete to authenticated
  using (team_id = public.current_team_id() and public.is_team_admin());

-- Capacity members
drop policy if exists "members_select_own_team" on public.capacity_members;
create policy "members_select_own_team"
  on public.capacity_members for select to authenticated
  using (
    sheet_id in (
      select id from public.capacity_sheets
      where team_id = public.current_team_id()
    )
  );

drop policy if exists "members_insert_admin" on public.capacity_members;
create policy "members_insert_admin"
  on public.capacity_members for insert to authenticated
  with check (
    sheet_id in (
      select id from public.capacity_sheets
      where team_id = public.current_team_id()
    )
    and public.is_team_admin()
  );

drop policy if exists "members_update_admin" on public.capacity_members;
create policy "members_update_admin"
  on public.capacity_members for update to authenticated
  using (
    sheet_id in (
      select id from public.capacity_sheets
      where team_id = public.current_team_id()
    )
    and public.is_team_admin()
  )
  with check (
    sheet_id in (
      select id from public.capacity_sheets
      where team_id = public.current_team_id()
    )
    and public.is_team_admin()
  );

drop policy if exists "members_delete_admin" on public.capacity_members;
create policy "members_delete_admin"
  on public.capacity_members for delete to authenticated
  using (
    sheet_id in (
      select id from public.capacity_sheets
      where team_id = public.current_team_id()
    )
    and public.is_team_admin()
  );

-- ---------------------------------------------------------------------------
-- Seed April 2026 sheets per team (sample data from input sheet)
-- ---------------------------------------------------------------------------
do $$
declare
  v_projects jsonb := '["Lotte","XtraSure","Padesar","Zuellig","Mastercard","Internal"]'::jsonb;
  v_month text := 'April';
  v_year int := 2026;
  v_sheet_id uuid;
  t_ad uuid;
  t_pod_b_a uuid;
  t_pod_a_b uuid;
  t_shared uuid;
begin
  select id into t_ad from public.teams where slug = 'ad';
  select id into t_pod_b_a from public.teams where slug = 'pod-b-a';
  select id into t_pod_a_b from public.teams where slug = 'pod-a-b';
  select id into t_shared from public.teams where slug = 'shared';

  -- AD team
  insert into public.capacity_sheets (team_id, month, year, projects)
  values (t_ad, v_month, v_year, v_projects)
  on conflict (team_id, month, year) do update set projects = excluded.projects
  returning id into v_sheet_id;

  delete from public.capacity_members where sheet_id = v_sheet_id;
  insert into public.capacity_members (sheet_id, name, pod, job_role, allocations, sort_order) values
    (v_sheet_id, 'Theint Theint', 'AD', 'Associate Director',
      '{"Lotte":20,"XtraSure":40,"Padesar":5,"Zuellig":10,"Mastercard":0,"Internal":0}'::jsonb, 0);

  -- Pod B + A team
  insert into public.capacity_sheets (team_id, month, year, projects)
  values (t_pod_b_a, v_month, v_year, v_projects)
  on conflict (team_id, month, year) do update set projects = excluded.projects
  returning id into v_sheet_id;

  delete from public.capacity_members where sheet_id = v_sheet_id;
  insert into public.capacity_members (sheet_id, name, pod, job_role, allocations, sort_order) values
    (v_sheet_id, 'May Thu Thu Ko', 'Pod B + A', 'Account Manager',
      '{"Lotte":20,"XtraSure":15,"Padesar":20,"Zuellig":30,"Mastercard":0,"Internal":0}'::jsonb, 0),
    (v_sheet_id, 'Alan', 'Pod B + A', 'Senior Executive',
      '{"Lotte":0,"XtraSure":20,"Padesar":0,"Zuellig":20,"Mastercard":0,"Internal":0}'::jsonb, 1);

  -- Pod A + B team
  insert into public.capacity_sheets (team_id, month, year, projects)
  values (t_pod_a_b, v_month, v_year, v_projects)
  on conflict (team_id, month, year) do update set projects = excluded.projects
  returning id into v_sheet_id;

  delete from public.capacity_members where sheet_id = v_sheet_id;
  insert into public.capacity_members (sheet_id, name, pod, job_role, allocations, sort_order) values
    (v_sheet_id, 'Wadi Tun Naing', 'Pod A + B', 'Account Manager',
      '{"Lotte":10,"XtraSure":30,"Padesar":0,"Zuellig":0,"Mastercard":0,"Internal":0}'::jsonb, 0);

  -- Shared team
  insert into public.capacity_sheets (team_id, month, year, projects)
  values (t_shared, v_month, v_year, v_projects)
  on conflict (team_id, month, year) do update set projects = excluded.projects
  returning id into v_sheet_id;

  delete from public.capacity_members where sheet_id = v_sheet_id;
  insert into public.capacity_members (sheet_id, name, pod, job_role, allocations, sort_order) values
    (v_sheet_id, 'Saw Thazin Soe', 'Shared', 'Senior Executive',
      '{"Lotte":10,"XtraSure":10,"Padesar":0,"Zuellig":10,"Mastercard":10,"Internal":0}'::jsonb, 0);

  -- Empty starter sheets for remaining teams
  insert into public.capacity_sheets (team_id, month, year, projects)
  select t.id, v_month, v_year, v_projects
  from public.teams t
  where t.slug in ('pod-a', 'pod-b', 'client-services', 'internal-ops')
  on conflict (team_id, month, year) do nothing;
end $$;
