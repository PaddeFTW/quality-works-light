-- Mål. Kör i Supabase SQL Editor.
-- Tom från början. Inget exempeldata.

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  area text not null default 'Kvalitet',
  name text not null,
  measure text not null default '',
  target_text text not null default '',
  owner_name text not null default '',
  due_on date,
  status text not null default 'plan',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.goals drop constraint if exists goals_status_check;
alter table public.goals add constraint goals_status_check
  check (status in ('plan', 'going', 'late', 'done'));

alter table public.goals enable row level security;

drop policy if exists "goals_member" on public.goals;
create policy "goals_member"
  on public.goals for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

grant select, insert, update, delete on public.goals to authenticated;

notify pgrst, 'reload schema';
