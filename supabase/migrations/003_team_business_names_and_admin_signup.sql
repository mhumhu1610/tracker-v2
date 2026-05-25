-- Business team names + allow Team Admin self-signup (export + manage members)
-- Run after 002a and 002

-- ---------------------------------------------------------------------------
-- 8 business teams (each has one Team Admin who manages members & exports)
-- ---------------------------------------------------------------------------
update public.teams set slug = 'reputation', name = 'Reputation' where slug = 'ad';
update public.teams set slug = 'creative', name = 'Creative' where slug = 'pod-a';
update public.teams set slug = 'strategy', name = 'Strategy' where slug = 'pod-b';
update public.teams set slug = 'partnerships', name = 'Partnerships' where slug = 'pod-a-b';
update public.teams set slug = 'campaigns', name = 'Campaigns' where slug = 'pod-b-a';
update public.teams set slug = 'shared-resources', name = 'Shared Resources' where slug = 'shared';
update public.teams set name = 'Client Services' where slug = 'client-services';
update public.teams set name = 'Internal Operations' where slug = 'internal-ops';

-- ---------------------------------------------------------------------------
-- Trigger: allow team_admin from app signup; only downgrade team_lead
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
  -- App signup: team_admin is allowed; team_lead is not self-service
  if v_source = 'app' and v_role::text = 'team_lead' then
    v_role := 'member';
  end if;
  -- Default app signups without role → team_admin (each team lead manages their sheet)
  if v_source = 'app' and v_role_text is null then
    v_role := 'team_admin';
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

-- ---------------------------------------------------------------------------
-- Onboarding: Team Admin or Member
-- ---------------------------------------------------------------------------
drop function if exists public.complete_profile(text, text);

create or replace function public.complete_profile(
  p_team_slug text,
  p_full_name text default null,
  p_role text default 'team_admin'
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
  v_role public.app_role := 'team_admin';
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

  if nullif(trim(p_role), '') in ('team_admin', 'member', 'viewer') then
    v_role := nullif(trim(p_role), '')::public.app_role;
  end if;

  select email into v_email from auth.users where id = auth.uid();

  insert into public.profiles (id, team_id, role, full_name, email)
  values (
    auth.uid(),
    v_team_id,
    v_role,
    coalesce(nullif(trim(p_full_name), ''), split_part(v_email, '@', 1)),
    v_email
  )
  returning * into v_profile;

  return v_profile;
end;
$$;

grant execute on function public.complete_profile(text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Fix existing accounts stuck as member (run once, adjust emails as needed)
-- ---------------------------------------------------------------------------
-- update public.profiles set role = 'team_admin' where email ilike '%theint%';
-- update public.profiles set role = 'team_admin' where email ilike '%winthu%';
