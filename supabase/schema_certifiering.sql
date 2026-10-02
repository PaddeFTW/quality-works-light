-- Inför certifiering. Kör i Supabase SQL Editor.
-- Tom från början. Inga exempelrader.

create table if not exists public.cert_checks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  prompt text not null,
  hint text not null default '',
  answer text not null default '',
  due_on date,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cert_checks drop constraint if exists cert_checks_answer_check;
alter table public.cert_checks add constraint cert_checks_answer_check
  check (answer in ('', 'yes', 'no'));

alter table public.cert_checks enable row level security;

drop policy if exists "cert_checks_member" on public.cert_checks;
create policy "cert_checks_member"
  on public.cert_checks for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

grant select, insert, update, delete on public.cert_checks to authenticated;

notify pgrst, 'reload schema';
