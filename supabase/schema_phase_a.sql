-- Phase A: Manual persistence extras + invites + storage
-- Run in SQL Editor AFTER schema.sql and fix_organizations_permission.sql

alter table public.manual_documents
  add column if not exists kind text not null default 'document';

alter table public.manual_documents
  drop constraint if exists manual_documents_kind_check;

alter table public.manual_documents
  add constraint manual_documents_kind_check
  check (kind in ('folder', 'document'));

create table if not exists public.document_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.manual_documents (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  edition int,
  created_at timestamptz not null default now(),
  unique (document_id, user_id, edition)
);

create table if not exists public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  role public.member_role not null default 'viewer',
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  invited_by uuid references public.profiles (id),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.document_acknowledgements enable row level security;
alter table public.organization_invites enable row level security;

drop policy if exists "acks_via_doc" on public.document_acknowledgements;
create policy "acks_via_doc"
  on public.document_acknowledgements for all to authenticated
  using (
    exists (
      select 1
      from public.manual_documents d
      join public.manuals m on m.id = d.manual_id
      where d.id = document_id and public.is_org_member(m.organization_id)
    )
  )
  with check (
    user_id = auth.uid() and exists (
      select 1
      from public.manual_documents d
      join public.manuals m on m.id = d.manual_id
      where d.id = document_id and public.is_org_member(m.organization_id)
    )
  );

drop policy if exists "invites_member_select" on public.organization_invites;
create policy "invites_member_select"
  on public.organization_invites for select to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists "invites_member_insert" on public.organization_invites;
create policy "invites_member_insert"
  on public.organization_invites for insert to authenticated
  with check (public.is_org_member(organization_id));

drop policy if exists "invites_member_update" on public.organization_invites;
create policy "invites_member_update"
  on public.organization_invites for update to authenticated
  using (public.is_org_member(organization_id));

-- Allow looking up an invite by token before membership exists (join flow)
drop policy if exists "invites_by_token" on public.organization_invites;
create policy "invites_by_token"
  on public.organization_invites for select to authenticated
  using (accepted_at is null);

grant select, insert, update, delete on public.document_acknowledgements to authenticated;
grant select, insert, update on public.organization_invites to authenticated;
grant select, insert, update, delete on public.manual_documents to authenticated;
grant select, insert, update, delete on public.document_versions to authenticated;
grant select, insert, update, delete on public.attachments to authenticated;

insert into storage.buckets (id, name, public)
values ('manual-attachments', 'manual-attachments', false)
on conflict (id) do nothing;

drop policy if exists "manual_attachments_select" on storage.objects;
create policy "manual_attachments_select"
  on storage.objects for select to authenticated
  using (bucket_id = 'manual-attachments');

drop policy if exists "manual_attachments_insert" on storage.objects;
create policy "manual_attachments_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'manual-attachments');

drop policy if exists "manual_attachments_update" on storage.objects;
create policy "manual_attachments_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'manual-attachments');

drop policy if exists "manual_attachments_delete" on storage.objects;
create policy "manual_attachments_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'manual-attachments');

notify pgrst, 'reload schema';
