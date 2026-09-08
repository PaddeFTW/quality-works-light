-- Phase C: Avvikelse, förbättringsförslag, årshjul
-- Run in Supabase SQL Editor AFTER schema.sql + schema_phase_a.sql + schema_phase_b.sql

create table if not exists public.deviations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  number int not null,
  title text not null,
  description text not null default '',
  category text not null default 'kvalitet',
  severity text not null default 'medium',
  status text not null default 'open',
  action text not null default '',
  owner_name text,
  due_date date,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  unique (organization_id, number)
);

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  number int not null,
  title text not null,
  description text not null default '',
  status text not null default 'new',
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, number)
);

create table if not exists public.year_activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  kind text not null default 'other',
  planned_on date not null,
  owner_name text,
  status text not null default 'planned',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.deviations
  drop constraint if exists deviations_status_check;
alter table public.deviations
  add constraint deviations_status_check
  check (status in ('open', 'in_progress', 'closed'));

alter table public.deviations
  drop constraint if exists deviations_severity_check;
alter table public.deviations
  add constraint deviations_severity_check
  check (severity in ('low', 'medium', 'high'));

alter table public.suggestions
  drop constraint if exists suggestions_status_check;
alter table public.suggestions
  add constraint suggestions_status_check
  check (status in ('new', 'reviewing', 'done', 'rejected'));

alter table public.year_activities
  drop constraint if exists year_activities_status_check;
alter table public.year_activities
  add constraint year_activities_status_check
  check (status in ('planned', 'done', 'skipped'));

alter table public.deviations enable row level security;
alter table public.suggestions enable row level security;
alter table public.year_activities enable row level security;

drop policy if exists "deviations_member" on public.deviations;
create policy "deviations_member"
  on public.deviations for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "suggestions_member" on public.suggestions;
create policy "suggestions_member"
  on public.suggestions for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "year_activities_member" on public.year_activities;
create policy "year_activities_member"
  on public.year_activities for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

grant select, insert, update, delete on public.deviations to authenticated;
grant select, insert, update, delete on public.suggestions to authenticated;
grant select, insert, update, delete on public.year_activities to authenticated;

create index if not exists deviations_org_idx on public.deviations (organization_id, created_at desc);
create index if not exists suggestions_org_idx on public.suggestions (organization_id, created_at desc);
create index if not exists year_activities_org_idx on public.year_activities (organization_id, planned_on);

notify pgrst, 'reload schema';
