-- Kör i Supabase SQL Editor. Gör att första inloggningen kan skapa företag.
-- Fungerar även för Google-inloggning (saknad profil).

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.manuals to authenticated;

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
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, full_name, email)
select id, coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', ''), email
from auth.users
on conflict (id) do nothing;

create or replace function public.create_company(
  p_name text,
  p_full_name text default '',
  p_org_number text default null,
  p_industry text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_org_id uuid;
  v_slug text;
begin
  if v_user is null then
    raise exception 'Inte inloggad';
  end if;

  insert into public.profiles (id, full_name, email)
  values (v_user, coalesce(p_full_name, ''), null)
  on conflict (id) do update
    set full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name);

  select organization_id into v_org_id
  from public.organization_members
  where user_id = v_user
  limit 1;
  if v_org_id is not null then
    return v_org_id;
  end if;

  v_slug := trim(both '-' from lower(regexp_replace(
    translate(p_name, 'ÅÄÖåäö', 'AAOaao'),
    '[^a-z0-9]+',
    '-',
    'g'
  )));
  if v_slug = '' then
    v_slug := 'foretag';
  end if;
  v_slug := left(v_slug, 40) || '-' || substr(v_user::text, 1, 8);

  insert into public.organizations (name, org_number, industry, slug)
  values (p_name, nullif(p_org_number, ''), nullif(p_industry, ''), v_slug)
  returning id into v_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, v_user, 'admin');

  insert into public.manuals (organization_id, name, issuer, header_text, footer_text)
  values (
    v_org_id,
    'Kvalitetsmanual',
    coalesce(p_full_name, ''),
    'Kvalitetsmanual – ' || p_name,
    'Internt dokument. Utskrift gäller endast utskriftsdagen.'
  );

  return v_org_id;
end;
$$;

grant execute on function public.create_company(text, text, text, text) to authenticated;

drop policy if exists "org_insert_authenticated" on public.organizations;
create policy "org_insert_authenticated"
  on public.organizations for insert to authenticated
  with check (true);

drop policy if exists "members_insert_self" on public.organization_members;
create policy "members_insert_self"
  on public.organization_members for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "members_select" on public.organization_members;
create policy "members_select"
  on public.organization_members for select to authenticated
  using (public.is_org_member(organization_id) or user_id = auth.uid());

notify pgrst, 'reload schema';
