-- Quality Works Light – multi-tenant schema
-- Run in Supabase SQL Editor after creating the project.

create extension if not exists "pgcrypto";

-- Organisations (companies)
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  org_number text,
  industry text,
  slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.member_role as enum ('admin', 'editor', 'viewer');

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.manuals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null default 'Kvalitetsmanual',
  issuer text,
  reviewer text,
  approver text,
  logo_url text,
  header_text text,
  footer_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.manual_documents (
  id uuid primary key default gen_random_uuid(),
  manual_id uuid not null references public.manuals (id) on delete cascade,
  parent_id uuid references public.manual_documents (id) on delete set null,
  slug text not null,
  title text not null,
  sort_order int not null default 0,
  draft_html text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (manual_id, slug)
);

create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.manual_documents (id) on delete cascade,
  edition int not null,
  content_html text not null,
  published_by uuid references public.profiles (id),
  published_at timestamptz not null default now(),
  unique (document_id, edition)
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.manual_documents (id) on delete cascade,
  file_name text not null,
  file_size bigint,
  mime_type text,
  storage_path text not null,
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create type public.review_status as enum ('pending', 'approved', 'rejected');

create table if not exists public.review_requests (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.manual_documents (id) on delete cascade,
  version_id uuid references public.document_versions (id) on delete set null,
  requested_by uuid references public.profiles (id),
  reviewer_user_id uuid references public.profiles (id),
  reviewer_name text,
  status public.review_status not null default 'pending',
  message text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete set null,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- RLS helpers
create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org_id and m.user_id = auth.uid()
  );
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.manuals enable row level security;
alter table public.manual_documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.attachments enable row level security;
alter table public.review_requests enable row level security;
alter table public.audit_logs enable row level security;

-- Basic policies (tighten later)
create policy "profiles_self" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "org_member_select" on public.organizations
  for select using (public.is_org_member(id));

create policy "members_select" on public.organization_members
  for select using (public.is_org_member(organization_id));

create policy "manuals_member" on public.manuals
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "docs_via_manual" on public.manual_documents
  for all using (
    exists (
      select 1 from public.manuals m
      where m.id = manual_id and public.is_org_member(m.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.manuals m
      where m.id = manual_id and public.is_org_member(m.organization_id)
    )
  );

create policy "versions_via_doc" on public.document_versions
  for all using (
    exists (
      select 1
      from public.manual_documents d
      join public.manuals m on m.id = d.manual_id
      where d.id = document_id and public.is_org_member(m.organization_id)
    )
  )
  with check (
    exists (
      select 1
      from public.manual_documents d
      join public.manuals m on m.id = d.manual_id
      where d.id = document_id and public.is_org_member(m.organization_id)
    )
  );

create policy "attachments_via_doc" on public.attachments
  for all using (
    exists (
      select 1
      from public.manual_documents d
      join public.manuals m on m.id = d.manual_id
      where d.id = document_id and public.is_org_member(m.organization_id)
    )
  )
  with check (
    exists (
      select 1
      from public.manual_documents d
      join public.manuals m on m.id = d.manual_id
      where d.id = document_id and public.is_org_member(m.organization_id)
    )
  );

create policy "reviews_via_doc" on public.review_requests
  for all using (
    exists (
      select 1
      from public.manual_documents d
      join public.manuals m on m.id = d.manual_id
      where d.id = document_id and public.is_org_member(m.organization_id)
    )
  )
  with check (
    exists (
      select 1
      from public.manual_documents d
      join public.manuals m on m.id = d.manual_id
      where d.id = document_id and public.is_org_member(m.organization_id)
    )
  );

-- Auto profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
