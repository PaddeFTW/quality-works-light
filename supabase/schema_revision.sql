-- Intern revision. Kör i Supabase SQL Editor.
-- Tom från början.

create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  auditor_name text not null default '',
  audited_on date not null default current_date,
  standard text not null default 'ISO 9001',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  audit_id uuid not null references public.audits (id) on delete cascade,
  clause text not null default '',
  prompt text not null,
  score int not null default 0,
  comment text not null default '',
  due_on date,
  closed boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.audit_items drop constraint if exists audit_items_score_check;
alter table public.audit_items add constraint audit_items_score_check check (score between 0 and 3);

alter table public.audits enable row level security;
alter table public.audit_items enable row level security;

drop policy if exists "audits_member" on public.audits;
create policy "audits_member"
  on public.audits for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "audit_items_member" on public.audit_items;
create policy "audit_items_member"
  on public.audit_items for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

grant select, insert, update, delete on public.audits to authenticated;
grant select, insert, update, delete on public.audit_items to authenticated;

notify pgrst, 'reload schema';
