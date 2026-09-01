-- Phase B: review status, manuals storage bucket, grants
-- Run AFTER schema.sql + schema_phase_a.sql

alter table public.manual_documents
  add column if not exists review_status text not null default 'draft';

alter table public.manual_documents
  drop constraint if exists manual_documents_review_status_check;

alter table public.manual_documents
  add constraint manual_documents_review_status_check
  check (review_status in ('draft', 'pending', 'approved', 'rejected'));

grant select, insert, update, delete on public.review_requests to authenticated;
grant select, insert, update, delete on public.attachments to authenticated;
grant select, insert, update, delete on public.document_versions to authenticated;
grant select, insert, update, delete on public.manuals to authenticated;

insert into storage.buckets (id, name, public)
values ('manuals', 'manuals', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('manual-attachments', 'manual-attachments', false)
on conflict (id) do nothing;

drop policy if exists "manuals_bucket_select" on storage.objects;
create policy "manuals_bucket_select"
  on storage.objects for select to authenticated
  using (bucket_id in ('manuals', 'manual-attachments'));

drop policy if exists "manuals_bucket_insert" on storage.objects;
create policy "manuals_bucket_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id in ('manuals', 'manual-attachments'));

drop policy if exists "manuals_bucket_update" on storage.objects;
create policy "manuals_bucket_update"
  on storage.objects for update to authenticated
  using (bucket_id in ('manuals', 'manual-attachments'));

drop policy if exists "manuals_bucket_delete" on storage.objects;
create policy "manuals_bucket_delete"
  on storage.objects for delete to authenticated
  using (bucket_id in ('manuals', 'manual-attachments'));

notify pgrst, 'reload schema';
