-- Manualen: saknade kolumner som gör att molnet inte kan läsas.
-- Kör en gång i Supabase → SQL Editor → Run.

alter table public.manual_documents
  add column if not exists kind text not null default 'document';

alter table public.manual_documents
  drop constraint if exists manual_documents_kind_check;

alter table public.manual_documents
  add constraint manual_documents_kind_check
  check (kind in ('folder', 'document'));

alter table public.manual_documents
  add column if not exists review_status text not null default 'draft';

alter table public.manual_documents
  drop constraint if exists manual_documents_review_status_check;

alter table public.manual_documents
  add constraint manual_documents_review_status_check
  check (review_status in ('draft', 'pending', 'approved', 'rejected'));

grant select, insert, update, delete on public.manuals to authenticated;
grant select, insert, update, delete on public.manual_documents to authenticated;
grant select, insert, update, delete on public.document_versions to authenticated;
grant select, insert, update, delete on public.attachments to authenticated;
grant select, insert, update, delete on public.review_requests to authenticated;
