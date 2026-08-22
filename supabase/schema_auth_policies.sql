-- Extra policies so a new user can create company + membership after signup.
-- Run this in SQL Editor if you already ran schema.sql.

create policy "org_insert_authenticated"
  on public.organizations
  for insert
  to authenticated
  with check (true);

create policy "org_update_member"
  on public.organizations
  for update
  to authenticated
  using (public.is_org_member(id));

create policy "members_insert_self"
  on public.organization_members
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "members_update_admin"
  on public.organization_members
  for update
  to authenticated
  using (public.is_org_member(organization_id));
