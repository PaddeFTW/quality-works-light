-- Sparar "vad ändrades" på varje utgåva.
-- Kör i Supabase SQL Editor. Publicera fungerar även utan den här filen.

alter table public.document_versions add column if not exists change_note text not null default '';

notify pgrst, 'reload schema';
