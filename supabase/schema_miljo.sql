-- Miljöaspekter. Kör i Supabase SQL Editor.
-- Tom från början.

create table if not exists public.environmental_aspects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  area text not null default 'Avfall',
  name text not null,
  happens text not null default '',
  score int not null default 3,
  action text not null default '',
  owner_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.environmental_aspects drop constraint if exists environmental_aspects_score_check;
alter table public.environmental_aspects add constraint environmental_aspects_score_check
  check (score between 1 and 5);

alter table public.environmental_aspects enable row level security;

drop policy if exists "aspects_member" on public.environmental_aspects;
create policy "aspects_member"
  on public.environmental_aspects for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

grant select, insert, update, delete on public.environmental_aspects to authenticated;

notify pgrst, 'reload schema';
