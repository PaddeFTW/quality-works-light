-- Admin can change roles, remove members, and rename the company.
-- Run in Supabase SQL Editor.

create or replace function public.is_org_admin(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.role = 'admin'
  );
$$;

grant execute on function public.is_org_admin(uuid) to authenticated;
grant update, delete on public.organization_members to authenticated;
grant update on public.organizations to authenticated;

drop policy if exists "members_update_admin" on public.organization_members;
create policy "members_update_admin"
  on public.organization_members for update to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

drop policy if exists "members_delete_admin" on public.organization_members;
create policy "members_delete_admin"
  on public.organization_members for delete to authenticated
  using (public.is_org_admin(organization_id));

drop policy if exists "org_update_admin" on public.organizations;
create policy "org_update_admin"
  on public.organizations for update to authenticated
  using (public.is_org_admin(id))
  with check (public.is_org_admin(id));

notify pgrst, 'reload schema';
