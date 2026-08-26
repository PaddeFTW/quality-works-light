-- Allow reading colleague profiles inside the same organisation.
-- Run after schema_phase_a.sql

drop policy if exists "profiles_org_readable" on public.profiles;
create policy "profiles_org_readable"
  on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.organization_members mine
      join public.organization_members theirs
        on theirs.organization_id = mine.organization_id
      where mine.user_id = auth.uid()
        and theirs.user_id = profiles.id
    )
  );
