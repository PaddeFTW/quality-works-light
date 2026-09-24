-- Leverantörer och våra bedömningar. Kör i Supabase SQL Editor.
-- Tom från början. Inga exempel.

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  supplier_number text not null default '',
  company text not null,
  contact_name text not null default '',
  email text not null default '',
  phone text not null default '',
  address text not null default '',
  grade int not null default 2,
  status text not null default 'improve',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.suppliers drop constraint if exists suppliers_grade_check;
alter table public.suppliers add constraint suppliers_grade_check check (grade between 1 and 3);

alter table public.suppliers drop constraint if exists suppliers_status_check;
alter table public.suppliers add constraint suppliers_status_check
  check (status in ('approved', 'improve', 'only'));

create table if not exists public.supplier_questions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  prompt text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.supplier_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  reviewed_on date not null default current_date,
  assessor_name text not null default '',
  comment text not null default '',
  scores jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.suppliers enable row level security;
alter table public.supplier_questions enable row level security;
alter table public.supplier_reviews enable row level security;

drop policy if exists "suppliers_member" on public.suppliers;
create policy "suppliers_member"
  on public.suppliers for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "supplier_questions_member" on public.supplier_questions;
create policy "supplier_questions_member"
  on public.supplier_questions for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "supplier_reviews_member" on public.supplier_reviews;
create policy "supplier_reviews_member"
  on public.supplier_reviews for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

grant select, insert, update, delete on public.suppliers to authenticated;
grant select, insert, update, delete on public.supplier_questions to authenticated;
grant select, insert, update, delete on public.supplier_reviews to authenticated;

notify pgrst, 'reload schema';
