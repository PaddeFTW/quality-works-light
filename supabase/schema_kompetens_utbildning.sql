-- Lägg till utbildning och signering på befintlig kompetensmatris.
-- Kör i Supabase SQL Editor om Personal redan finns.

alter table public.competence_levels add column if not exists note text not null default '';
alter table public.competence_levels add column if not exists due_on date;
alter table public.competence_levels add column if not exists signed_name text;
alter table public.competence_levels add column if not exists signed_at timestamptz;

notify pgrst, 'reload schema';
