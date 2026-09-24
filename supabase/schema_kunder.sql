-- Kunder och omdömen. Kör i Supabase SQL Editor.
-- Tom från början. Inga exempelkunder.

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  customer_number text not null default '',
  company text not null,
  contact_name text not null default '',
  our_contact text not null default '',
  email text not null default '',
  phone text not null default '',
  grade int not null default 2,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers drop constraint if exists customers_grade_check;
alter table public.customers add constraint customers_grade_check check (grade between 1 and 3);

create table if not exists public.customer_questions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  area text not null default 'Kvalitet',
  prompt text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  reviewed_on date not null default current_date,
  filled_by text not null default 'oss',
  comment text not null default '',
  scores jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.customer_reviews drop constraint if exists customer_reviews_filled_by_check;
alter table public.customer_reviews add constraint customer_reviews_filled_by_check
  check (filled_by in ('oss', 'kund'));

alter table public.customers enable row level security;
alter table public.customer_questions enable row level security;
alter table public.customer_reviews enable row level security;

drop policy if exists "customers_member" on public.customers;
create policy "customers_member"
  on public.customers for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "customer_questions_member" on public.customer_questions;
create policy "customer_questions_member"
  on public.customer_questions for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "customer_reviews_member" on public.customer_reviews;
create policy "customer_reviews_member"
  on public.customer_reviews for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.customer_questions to authenticated;
grant select, insert, update, delete on public.customer_reviews to authenticated;

notify pgrst, 'reload schema';
