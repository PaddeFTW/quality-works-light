-- Laglista. Kör i Supabase SQL Editor.
-- Tom från början. Inget exempeldata.

create table if not exists public.laws (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  area text not null default 'Övrigt',
  name text not null,
  description text not null default '',
  impact text not null default '',
  compliance_text text not null default '',
  law_url text not null default '',
  update_url text not null default '',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.law_files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  law_id uuid not null references public.laws (id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

alter table public.laws drop constraint if exists laws_status_check;
alter table public.laws add constraint laws_status_check
  check (status in ('open', 'partial', 'ok', 'skip'));

alter table public.laws enable row level security;
alter table public.law_files enable row level security;

drop policy if exists "laws_member" on public.laws;
create policy "laws_member"
  on public.laws for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "law_files_member" on public.law_files;
create policy "law_files_member"
  on public.law_files for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

grant select, insert, update, delete on public.laws to authenticated;
grant select, insert, update, delete on public.law_files to authenticated;

notify pgrst, 'reload schema';
