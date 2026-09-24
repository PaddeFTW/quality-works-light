-- Ledningens genomgång. Kör i Supabase SQL Editor.
-- Tom från början. Siffrorna läses från de andra modulerna.

create table if not exists public.management_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  held_on date not null default current_date,
  chair_name text not null default '',
  secretary_name text not null default '',
  attendees text not null default '',
  next_on date,
  verdict text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.management_reviews drop constraint if exists management_reviews_verdict_check;
alter table public.management_reviews add constraint management_reviews_verdict_check
  check (verdict in ('', 'ok', 'change'));

create table if not exists public.management_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  review_id uuid not null references public.management_reviews (id) on delete cascade,
  point text not null,
  body text not null default '',
  unique (review_id, point)
);

create table if not exists public.management_decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  review_id uuid not null references public.management_reviews (id) on delete cascade,
  body text not null,
  owner_name text not null default '',
  due_on date,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.management_reviews enable row level security;
alter table public.management_notes enable row level security;
alter table public.management_decisions enable row level security;

drop policy if exists "management_reviews_member" on public.management_reviews;
create policy "management_reviews_member"
  on public.management_reviews for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "management_notes_member" on public.management_notes;
create policy "management_notes_member"
  on public.management_notes for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "management_decisions_member" on public.management_decisions;
create policy "management_decisions_member"
  on public.management_decisions for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

grant select, insert, update, delete on public.management_reviews to authenticated;
grant select, insert, update, delete on public.management_notes to authenticated;
grant select, insert, update, delete on public.management_decisions to authenticated;

notify pgrst, 'reload schema';
