-- Kompetensmatris. Kör i Supabase SQL Editor efter schema.sql.
-- Personer med konto kommer från organization_members.
-- Här sparas kompetenser (Truckkort, Intern revision) och vem som kan dem.

create table if not exists public.competences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.competence_people (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  person_key text not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, person_key)
);

create table if not exists public.competence_levels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  competence_id uuid not null references public.competences (id) on delete cascade,
  person_key text not null,
  level text not null default 'missing',
  updated_at timestamptz not null default now(),
  unique (competence_id, person_key)
);

alter table public.competence_levels
  drop constraint if exists competence_levels_level_check;
alter table public.competence_levels
  add constraint competence_levels_level_check
  check (level in ('missing', 'training', 'ok'));

alter table public.competences enable row level security;
alter table public.competence_people enable row level security;
alter table public.competence_levels enable row level security;

drop policy if exists "competences_member" on public.competences;
create policy "competences_member"
  on public.competences for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "competence_people_member" on public.competence_people;
create policy "competence_people_member"
  on public.competence_people for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "competence_levels_member" on public.competence_levels;
create policy "competence_levels_member"
  on public.competence_levels for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

grant select, insert, update, delete on public.competences to authenticated;
grant select, insert, update, delete on public.competence_people to authenticated;
grant select, insert, update, delete on public.competence_levels to authenticated;

notify pgrst, 'reload schema';
