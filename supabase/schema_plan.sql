-- Paket på företaget. Kör en gång i Supabase SQL Editor.
-- Befintliga företag blir Standard så visningen inte låses.

alter table public.organizations
  add column if not exists plan text not null default 'standard';

alter table public.organizations
  drop constraint if exists organizations_plan_check;

alter table public.organizations
  add constraint organizations_plan_check
  check (plan in ('gratis', 'small', 'standard', 'pro'));

grant select, update (plan) on public.organizations to authenticated;
