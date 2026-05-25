-- STEP 1 of 2 — Run this FIRST, then run 002_fix_auth_signup_roles.sql
-- PostgreSQL requires new enum values to be committed before they can be referenced.

do $$ begin
  alter type public.app_role add value if not exists 'viewer';
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter type public.app_role add value if not exists 'team_lead';
exception
  when duplicate_object then null;
end $$;
