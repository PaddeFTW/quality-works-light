-- Fix: permission denied for table organizations
-- Run this entire script once in Supabase → SQL Editor → Run

-- 1) Table privileges for API roles
grant usage on schema public to anon, authenticated;

grant select, insert, update on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.manuals to authenticated;
grant select, insert, update, delete on public.manual_documents to authenticated;
grant select, insert, update, delete on public.document_versions to authenticated;
grant select, insert, update, delete on public.attachments to authenticated;
grant select, insert, update, delete on public.review_requests to authenticated;
grant select, insert on public.audit_logs to authenticated;

-- 2) Ensure helper exists
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

grant execute on function public.is_org_member(uuid) to authenticated, anon;

-- 3) Drop old policies if they exist (ignore errors by using drop if exists)
drop policy if exists "org_insert_authenticated" on public.organizations;
drop policy if exists "org_member_select" on public.organizations;
drop policy if exists "org_update_member" on public.organizations;
drop policy if exists "members_insert_self" on public.organization_members;
drop policy if exists "members_select" on public.organization_members;
drop policy if exists "members_update_admin" on public.organization_members;
drop policy if exists "manuals_member" on public.manuals;
drop policy if exists "profiles_self" on public.profiles;

-- 4) Organizations
create policy "org_select_member"
  on public.organizations for select to authenticated
  using (public.is_org_member(id));

create policy "org_insert_authenticated"
  on public.organizations for insert to authenticated
  with check (true);

create policy "org_update_member"
  on public.organizations for update to authenticated
  using (public.is_org_member(id));

-- 5) Members
create policy "members_select"
  on public.organization_members for select to authenticated
  using (public.is_org_member(organization_id) or user_id = auth.uid());

create policy "members_insert_self"
  on public.organization_members for insert to authenticated
  with check (user_id = auth.uid());

create policy "members_update"
  on public.organization_members for update to authenticated
  using (public.is_org_member(organization_id));

-- 6) Profiles
create policy "profiles_self"
  on public.profiles for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- 7) Manuals
create policy "manuals_member"
  on public.manuals for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- Allow insert of first manual right after org create:
-- user is member only AFTER organization_members insert.
-- So manuals insert must allow creator during same request via exists membership OR we insert member first (app already does member then manual).

notify pgrst, 'reload schema';
