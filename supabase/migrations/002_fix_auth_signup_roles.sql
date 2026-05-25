-- STEP 2 of 2 — Run AFTER 002a_add_enum_roles.sql
-- (If you already added viewer/team_lead via 002a, you can run this file alone.)

-- ---------------------------------------------------------------------------
-- Updated team display names (slugs unchanged for existing links)
-- ---------------------------------------------------------------------------
update public.teams set name = 'Associate Directors' where slug = 'ad';
update public.teams set name = 'Growth Pod A' where slug = 'pod-a';
update public.teams set name = 'Growth Pod B' where slug = 'pod-b';
update public.teams set name = 'Cross Pod (A + B)' where slug = 'pod-a-b';
update public.teams set name = 'Cross Pod (B + A)' where slug = 'pod-b-a';
update public.teams set name = 'Shared Resources' where slug = 'shared';
update public.teams set name = 'Client Services' where slug = 'client-services';
update public.teams set name = 'Internal Operations' where slug = 'internal-ops';

-- ---------------------------------------------------------------------------
-- Safe user trigger — NEVER blocks auth.users insert
-- Uses text comparison for roles (safe in same transaction as enum adds)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_team_slug text;
  v_role_text text;
  v_role public.app_role := 'member';
  v_source text;
begin
  if exists (select 1 from public.profiles where id = new.id) then
    return new;
  end if;

  v_team_slug := nullif(trim(coalesce(new.raw_user_meta_data->>'team_slug', '')), '');

  if v_team_slug is not null then
    select id into v_team_id from public.teams where slug = v_team_slug;
  end if;

  if v_team_id is null then
    return new;
  end if;

  v_role_text := nullif(trim(coalesce(new.raw_user_meta_data->>'role', '')), '');

  if v_role_text is not null then
    begin
      v_role := v_role_text::public.app_role;
    exception
      when others then
        v_role := 'member';
    end;
  end if;

  v_source := coalesce(new.raw_user_meta_data->>'signup_source', 'app');
  if v_source = 'app' and v_role::text = 'team_lead' then
    v_role := 'member';
  end if;

  insert into public.profiles (id, team_id, role, full_name, email)
  values (
    new.id,
    v_team_id,
    v_role,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;

  return new;
exception
  when others then
    raise warning 'handle_new_user skipped for %: %', new.id, sqlerrm;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Onboarding RPC
-- ---------------------------------------------------------------------------
create or replace function public.complete_profile(
  p_team_slug text,
  p_full_name text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_email text;
  v_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'Profile already exists';
  end if;

  select id into v_team_id
  from public.teams
  where slug = nullif(trim(p_team_slug), '');

  if v_team_id is null then
    raise exception 'Invalid team selected';
  end if;

  select email into v_email from auth.users where id = auth.uid();

  insert into public.profiles (id, team_id, role, full_name, email)
  values (
    auth.uid(),
    v_team_id,
    'member'::public.app_role,
    coalesce(nullif(trim(p_full_name), ''), split_part(v_email, '@', 1)),
    v_email
  )
  returning * into v_profile;

  return v_profile;
end;
$$;

grant execute on function public.complete_profile(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Permission helpers — text cast avoids enum commit ordering issues
-- ---------------------------------------------------------------------------
create or replace function public.is_team_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.current_role()::text in ('team_admin', 'team_lead'),
    false
  )
$$;

create or replace function public.is_team_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role()::text = 'team_admin', false)
$$;

-- ---------------------------------------------------------------------------
-- Teams visible for signup team picker
-- ---------------------------------------------------------------------------
drop policy if exists "teams_select_own" on public.teams;
drop policy if exists "teams_select_signup" on public.teams;

create policy "teams_select_signup"
  on public.teams for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- RLS: team_lead + team_admin can edit
-- ---------------------------------------------------------------------------
drop policy if exists "sheets_insert_admin" on public.capacity_sheets;
drop policy if exists "sheets_insert_editor" on public.capacity_sheets;
create policy "sheets_insert_editor"
  on public.capacity_sheets for insert to authenticated
  with check (
    team_id = public.current_team_id()
    and public.is_team_editor()
  );

drop policy if exists "sheets_update_admin" on public.capacity_sheets;
drop policy if exists "sheets_update_editor" on public.capacity_sheets;
create policy "sheets_update_editor"
  on public.capacity_sheets for update to authenticated
  using (team_id = public.current_team_id() and public.is_team_editor())
  with check (team_id = public.current_team_id() and public.is_team_editor());

drop policy if exists "sheets_delete_admin" on public.capacity_sheets;
drop policy if exists "sheets_delete_editor" on public.capacity_sheets;
create policy "sheets_delete_editor"
  on public.capacity_sheets for delete to authenticated
  using (team_id = public.current_team_id() and public.is_team_editor());

drop policy if exists "members_insert_admin" on public.capacity_members;
drop policy if exists "members_insert_editor" on public.capacity_members;
create policy "members_insert_editor"
  on public.capacity_members for insert to authenticated
  with check (
    sheet_id in (
      select id from public.capacity_sheets
      where team_id = public.current_team_id()
    )
    and public.is_team_editor()
  );

drop policy if exists "members_update_admin" on public.capacity_members;
drop policy if exists "members_update_editor" on public.capacity_members;
create policy "members_update_editor"
  on public.capacity_members for update to authenticated
  using (
    sheet_id in (
      select id from public.capacity_sheets
      where team_id = public.current_team_id()
    )
    and public.is_team_editor()
  )
  with check (
    sheet_id in (
      select id from public.capacity_sheets
      where team_id = public.current_team_id()
    )
    and public.is_team_editor()
  );

drop policy if exists "members_delete_admin" on public.capacity_members;
drop policy if exists "members_delete_editor" on public.capacity_members;
create policy "members_delete_editor"
  on public.capacity_members for delete to authenticated
  using (
    sheet_id in (
      select id from public.capacity_sheets
      where team_id = public.current_team_id()
    )
    and public.is_team_editor()
  );
